import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Check, Copy, Mail, Send, Users } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";

interface CreatedInvite {
  id: string;
  email: string;
  token: string;
  sent?: boolean;
}

const makeToken = () =>
  (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 40);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Bulk invite: the coach pastes the email list of a past camp / academy group,
 * every player gets a personal invite link, and the app can mail them out.
 */
const BulkInvite = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [raw, setRaw] = useState("");
  const [academy, setAcademy] = useState("Tio Tio Padel Academy");
  const [message, setMessage] = useState(
    "You trained with me during our academy week. To put your assessment into the app I need you to register — it only takes a minute."
  );
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState<CreatedInvite[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const emails = Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    )
  );

  const linkOf = (t: string) => `${window.location.origin}/invite/${t}`;

  const createInvites = async () => {
    if (!user) return;
    if (!emails.length) return toast.error("No valid email addresses found");

    setBusy(true);
    const expires = new Date();
    expires.setDate(expires.getDate() + 60);

    // Skip anyone who already has an open invite from this coach.
    const { data: existing } = await supabase
      .from("coach_invites")
      .select("email, token, id")
      .eq("coach_id", user.id)
      .is("accepted_at", null);

    const known = new Map(
      (existing || [])
        .filter((e) => e.email)
        .map((e) => [String(e.email).toLowerCase(), e as { id: string; token: string }])
    );

    const fresh = emails.filter((e) => !known.has(e));
    let inserted: CreatedInvite[] = [];

    if (fresh.length) {
      const { data, error } = await supabase
        .from("coach_invites")
        .insert(
          fresh.map((email) => ({
            coach_id: user.id,
            email,
            note: message.trim().slice(0, 500) || null,
            token: makeToken(),
            expires_at: expires.toISOString(),
          })) as any
        )
        .select("id, email, token");

      if (error) {
        setBusy(false);
        toast.error("Could not create the invites", { description: error.message });
        return;
      }
      inserted = (data || []).map((d) => ({ id: d.id, email: d.email || "", token: d.token }));
    }

    const reused = emails
      .filter((e) => known.has(e))
      .map((e) => ({ id: known.get(e)!.id, email: e, token: known.get(e)!.token }));

    setCreated([...inserted, ...reused]);
    setBusy(false);
    toast.success(`${inserted.length + reused.length} invite links ready`, {
      description: reused.length ? `${reused.length} already existed and were reused.` : undefined,
    });
  };

  const copyAll = async () => {
    const text = created.map((c) => `${c.email} — ${linkOf(c.token)}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All links copied");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const sendEmails = async () => {
    if (!created.length) return;
    setSending(true);
    let ok = 0;
    let failed = 0;

    for (const inv of created) {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "coach-invitation",
          recipientEmail: inv.email,
          idempotencyKey: `coach-invite-${inv.id}`,
          templateData: {
            coachName: profile?.full_name || "your coach",
            academyName: academy.trim() || null,
            message: message.trim() || null,
            inviteUrl: linkOf(inv.token),
          },
        },
      });
      if (error) failed++;
      else {
        ok++;
        setCreated((prev) => prev.map((c) => (c.id === inv.id ? { ...c, sent: true } : c)));
      }
    }

    setSending(false);
    if (ok) toast.success(`${ok} invitation email${ok === 1 ? "" : "s"} sent`);
    if (failed)
      toast.error(`${failed} could not be sent`, {
        description: "Email sending needs the sender domain to be verified. You can still share the links manually.",
      });
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/coach/players")}
          className="inline-flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> PLAYERS
        </button>

        <h1 className="font-display text-2xl sm:text-3xl text-foreground mb-1">INVITE A GROUP</h1>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Paste the email list of your camp or academy group. Everyone gets a personal link where they
          only set a password — then they land straight in your player list.
        </p>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
              <Users size={13} className="text-primary" /> ACADEMY / GROUP NAME
            </label>
            <input
              value={academy}
              onChange={(e) => setAcademy(e.target.value)}
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
              <Mail size={13} className="text-primary" /> EMAIL ADDRESSES
            </label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              placeholder="Paste emails — separated by commas, spaces or line breaks"
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 font-body text-[11px] text-muted-foreground">
              {emails.length} valid address{emails.length === 1 ? "" : "es"} detected
            </p>
          </div>

          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">
              PERSONAL MESSAGE
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 font-body text-[11px] text-muted-foreground">
              Shown in the email and on the invite page.
            </p>
          </div>

          <button
            onClick={createInvites}
            disabled={busy || !emails.length}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Users size={16} /> {busy ? "CREATING…" : `CREATE ${emails.length || ""} INVITE LINKS`}
          </button>
        </div>

        {created.length > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-sm tracking-wider text-foreground">
                {created.length} LINKS READY
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 font-display text-[11px] tracking-wider text-foreground hover:bg-secondary/80"
                >
                  {copiedAll ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  COPY ALL
                </button>
                <button
                  onClick={sendEmails}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-display text-[11px] tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  <Send size={14} /> {sending ? "SENDING…" : "SEND EMAILS"}
                </button>
              </div>
            </div>

            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {created.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate font-body text-xs text-foreground">{c.email}</span>
                  {c.sent && <Check size={14} className="shrink-0 text-emerald-400" />}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkOf(c.token));
                      toast.success("Link copied");
                    }}
                    className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                    title="Copy link"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default BulkInvite;
