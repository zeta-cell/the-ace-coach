import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    const { data: allModules } = await admin.from("modules").select("id, title, category, duration_minutes").eq("is_shared", true);
    if (!allModules || allModules.length === 0) {
      return new Response(JSON.stringify({ error: "No shared modules found." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate modules by title (take first)
    const moduleByTitle = new Map<string, any>();
    for (const m of allModules) {
      if (!moduleByTitle.has(m.title)) moduleByTitle.set(m.title, m);
    }

    const resolve = (titles: string[]) => {
      const ids: string[] = [], durs: number[] = [], notes: string[] = [];
      let total = 0;
      for (const t of titles) {
        const m = moduleByTitle.get(t);
        if (m) { ids.push(m.id); durs.push(m.duration_minutes || 15); notes.push(""); total += m.duration_minutes || 15; }
      }
      return { ids, durs, notes, total };
    };

    // Find all system blocks with empty module_ids
    const { data: emptyBlocks } = await admin
      .from("training_blocks")
      .select("id, title")
      .eq("is_system", true)
      .or("module_ids.is.null,module_ids.eq.{}");

    const mapping: Record<string, string[]> = {
      "Serve & Return Clinic": ["Shadow Court Warm-Up", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Net Approach & Volley", "Active Cool-Down Jog"],
    };

    const results: string[] = [];

    if (emptyBlocks) {
      for (const block of emptyBlocks) {
        const moduleTitles = mapping[block.title];
        if (!moduleTitles) {
          results.push(`⚠ ${block.title}: no mapping defined`);
          continue;
        }
        const { ids, durs, notes, total } = resolve(moduleTitles);
        if (ids.length === 0) {
          results.push(`⚠ ${block.title}: no modules resolved`);
          continue;
        }
        const { error } = await admin.from("training_blocks").update({
          module_ids: ids, module_durations: durs, module_notes: notes, duration_minutes: total,
        }).eq("id", block.id);
        results.push(error ? `❌ ${block.title}: ${error.message}` : `🔄 ${block.title}: ${ids.length} modules (${total}min)`);
      }
    }

    // Final count
    const { data: finalCount } = await admin
      .from("training_blocks")
      .select("id", { count: "exact" })
      .eq("is_system", true);

    const { data: emptyCount } = await admin
      .from("training_blocks")
      .select("id", { count: "exact" })
      .eq("is_system", true)
      .or("module_ids.is.null,module_ids.eq.{}");

    return new Response(
      JSON.stringify({
        success: true,
        total_system_blocks: finalCount?.length || 0,
        still_empty: emptyCount?.length || 0,
        updates: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
