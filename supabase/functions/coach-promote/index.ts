import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, HttpError, requireUserId } from "../_shared/auth.ts";

interface Payload {
  headline: string;
  message: string;
  ctaUrl?: string;
  ctaLabel?: string;
  detailLines?: string[];
  audiences?: string[]; // "players" | "followers"
  channels?: { dm?: boolean; email?: boolean };
  dryRun?: boolean;
}

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const coachId = await requireUserId(req);
    const db = admin();

    // Only coaches may broadcast
    const { data: role } = await db
      .from("user_roles").select("role").eq("user_id", coachId).in("role", ["coach", "admin"]).maybeSingle();
    if (!role) throw new HttpError(403, "Coach account required");

    const body = (await req.json()) as Payload;
    const headline = (body.headline || "").trim().slice(0, 120);
    const message = (body.message || "").trim().slice(0, 2000);
    if (!headline || !message) throw new HttpError(400, "headline and message are required");

    const audiences = body.audiences?.length ? body.audiences : ["players"];
    const channels = { dm: body.channels?.dm !== false, email: !!body.channels?.email };

    // ── Resolve recipients ──
    const ids = new Set<string>();

    if (audiences.includes("players")) {
      const { data } = await db.from("coach_player_assignments").select("player_id").eq("coach_id", coachId);
      (data || []).forEach((r) => ids.add(r.player_id));
    }

    if (audiences.includes("followers")) {
      const { data: clubs } = await db.from("club_coaches").select("club_id").eq("coach_id", coachId);
      const clubIds = (clubs || []).map((c) => c.club_id);
      if (clubIds.length) {
        const { data } = await db.from("club_followers").select("user_id").in("club_id", clubIds);
        (data || []).forEach((r) => ids.add(r.user_id));
      }
    }

    ids.delete(coachId);
    const recipientIds = [...ids];

    if (body.dryRun) {
      return json({ recipients: recipientIds.length });
    }
    if (recipientIds.length === 0) {
      return json({ recipients: 0, dm_sent: 0, emails_sent: 0 });
    }

    const { data: coachProfile } = await db
      .from("profiles").select("full_name, avatar_url").eq("user_id", coachId).maybeSingle();
    const coachName = coachProfile?.full_name || "Your coach";

    const { data: profiles } = await db
      .from("profiles").select("user_id, email").in("user_id", recipientIds);

    const ctaUrl = body.ctaUrl || "https://hivolley.com/events";
    const detailLines = (body.detailLines || []).filter(Boolean).slice(0, 6);
    const dmText = [headline, "", message, "", ...detailLines, "", ctaUrl].join("\n");

    let dmSent = 0;
    if (channels.dm) {
      const rows = recipientIds.map((id) => ({ sender_id: coachId, receiver_id: id, content: dmText }));
      const { error } = await db.from("messages").insert(rows);
      if (error) console.error("DM insert failed", error);
      else dmSent = rows.length;

      await db.from("notifications").insert(
        recipientIds.map((id) => ({
          user_id: id,
          title: `${coachName}: ${headline}`,
          body: message.slice(0, 200),
          link: ctaUrl.startsWith("http") ? "/messages" : ctaUrl,
        })),
      );
    }

    let emailsSent = 0;
    if (channels.email) {
      const emails = (profiles || []).map((p) => p.email).filter((e): e is string => !!e);
      for (const email of emails) {
        try {
          const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              templateName: "coach-announcement",
              recipientEmail: email,
              templateData: {
                coachName,
                coachAvatarUrl: coachProfile?.avatar_url ?? null,
                headline,
                message,
                ctaLabel: body.ctaLabel || "View details",
                ctaUrl,
                detailLines,
              },
            }),
          });
          if (res.ok) emailsSent++;
          else console.error(`email failed [${res.status}]:`, await res.text());
        } catch (e) {
          console.error("email error", e);
        }
      }
    }

    return json({ recipients: recipientIds.length, dm_sent: dmSent, emails_sent: emailsSent });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const msg = e instanceof Error ? e.message : "Unexpected error";
    console.error("coach-promote failed:", msg);
    return json({ error: msg }, status);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
