import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const EMAIL = "club.manager@the-ace.academy";
    const PASSWORD = "AceAcademy2026!";

    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((u: any) => u.email === EMAIL);

    let userId: string;

    if (found) {
      userId = found.id;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Club Manager Demo" },
      });
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = data.user.id;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // Assign club_manager role
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "club_manager" },
      { onConflict: "user_id,role" }
    );

    await admin.from("profiles").update({
      email: EMAIL,
      full_name: "Club Manager Demo",
      onboarding_completed: true,
    }).eq("user_id", userId);

    // Ensure a demo club exists, owned by this user
    const { data: existingClub } = await admin
      .from("clubs")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!existingClub) {
      await admin.from("clubs").insert({
        owner_id: userId,
        name: "Ace Demo Club",
        slug: "ace-demo-club",
        city: "Berlin",
        country: "Germany",
        description: "Premier padel & tennis academy — demo club for testing.",
        contact_email: EMAIL,
        is_active: true,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Club Manager ready. Email: ${EMAIL} / Password: ${PASSWORD}`,
        user_id: userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
