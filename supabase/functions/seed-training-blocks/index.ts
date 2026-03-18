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

    // Get all shared modules to reference by title
    const { data: allModules } = await admin.from("modules").select("id, title, category, duration_minutes").eq("is_shared", true);
    if (!allModules || allModules.length === 0) {
      return new Response(JSON.stringify({ error: "No shared modules found. Run seed-data first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const findModule = (title: string) => allModules.find((m: any) => m.title === title);

    const blocks = [
      // BEGINNER BLOCKS (4)
      {
        title: "Beginner Welcome Session",
        description: "Perfect first-day session covering basics of padel movement and grip.",
        category: "beginner", goal: "Learn fundamentals", difficulty: "beginner", sport: "padel",
        modules: ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Forehand Cross-Court Rally", "Serve + 1 Pattern", "Static Stretching Routine"],
      },
      {
        title: "First Steps: Court Movement",
        description: "Build court awareness and basic footwork patterns.",
        category: "beginner", goal: "Improve court movement", difficulty: "beginner", sport: "both",
        modules: ["Resistance Band Activation", "Split-Step Footwork", "Cone Agility Circuit", "Net Approach & Volley", "Foam Rolling Recovery"],
      },
      {
        title: "Beginner Serve & Return",
        description: "Master the basics of serving and returning in padel.",
        category: "beginner", goal: "Build serve confidence", difficulty: "beginner", sport: "padel",
        modules: ["Shadow Court Warm-Up", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Active Cool-Down Jog"],
      },
      {
        title: "Beginner Full Day",
        description: "Complete beginner training: warm-up, drills, fitness, and recovery.",
        category: "beginner", goal: "Full beginner development", difficulty: "beginner", sport: "both",
        modules: ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Forehand Cross-Court Rally", "Serve + 1 Pattern", "Core Stability Circuit", "Foam Rolling Recovery", "Pre-Match Nutrition Plan"],
      },

      // INTERMEDIATE BLOCKS (6)
      {
        title: "Power Serve Session",
        description: "Develop a powerful and consistent serve with physical conditioning.",
        category: "power", goal: "Improve serve power & placement", difficulty: "intermediate", sport: "padel",
        modules: ["Resistance Band Activation", "Serve + 1 Pattern", "Rotational Power", "Resistance Band Shoulders", "Static Stretching Routine"],
      },
      {
        title: "Defensive Wall Builder",
        description: "Train defensive shots, lobs, and wall play to become unbreakable.",
        category: "defense", goal: "Build defensive consistency", difficulty: "intermediate", sport: "padel",
        modules: ["Dynamic Warm-Up", "Lob Defense Drill", "Wall Play Rebound", "Backhand Slice & Drive", "Cone Agility Circuit", "Foam Rolling Recovery"],
      },
      {
        title: "Net Domination Drill",
        description: "Master the net position with volleys, approach shots, and finishing.",
        category: "net_play", goal: "Dominate the net", difficulty: "intermediate", sport: "padel",
        modules: ["Agility Ladder Warm-Up", "Net Approach & Volley", "Volley Clinic", "Split-Step Footwork", "Yoga Recovery Flow"],
      },
      {
        title: "Tactical Match Prep",
        description: "Prepare for competitive matches with point construction and mental focus.",
        category: "match_prep", goal: "Match day preparation", difficulty: "intermediate", sport: "both",
        modules: ["Shadow Court Warm-Up", "Point Construction Rally", "Pressure Point Practice", "Match Visualization", "Pre-Match Nutrition Plan"],
      },
      {
        title: "Speed & Agility Focus",
        description: "Explosive movement training for faster court coverage.",
        category: "speed", goal: "Increase court speed", difficulty: "intermediate", sport: "both",
        modules: ["Agility Ladder Warm-Up", "Spider Drill", "Cone Agility Circuit", "HIIT Court Circuit", "Stretching Cool-Down"],
      },
      {
        title: "Forehand & Backhand Tune-Up",
        description: "Refine groundstroke technique with focused drills.",
        category: "technique", goal: "Improve groundstrokes", difficulty: "intermediate", sport: "both",
        modules: ["Resistance Band Activation", "Forehand Cross-Court Rally", "Backhand Slice & Drive", "Core Stability Circuit", "Static Stretching Routine"],
      },

      // ADVANCED BLOCKS (6)
      {
        title: "Elite Competition Day",
        description: "Full competition-day simulation with physical and mental prep.",
        category: "competition", goal: "Peak match performance", difficulty: "advanced", sport: "both",
        modules: ["Dynamic Warm-Up", "Shadow Court Warm-Up", "Point Construction Rally", "4-Point Rotation Drill", "Pressure Point Practice", "Match Visualization", "Post-Match Recovery Meal"],
      },
      {
        title: "Smash & Overhead Mastery",
        description: "Perfect overhead shots including bandeja, víbora, and power smash.",
        category: "power", goal: "Master overhead shots", difficulty: "advanced", sport: "padel",
        modules: ["Resistance Band Activation", "Bandeja & Vibora", "Smash Technique", "Wall Play Rebound", "Rotational Power", "Stretching Cool-Down"],
      },
      {
        title: "Endurance Beast Mode",
        description: "Push physical limits with sustained high-intensity training.",
        category: "endurance", goal: "Build match endurance", difficulty: "advanced", sport: "both",
        modules: ["Dynamic Warm-Up", "HIIT Court Circuit", "Point Construction Rally", "Jump Rope Circuit", "Foam Rolling Recovery"],
      },
      {
        title: "Strength & Power Day",
        description: "Off-court strength session to build padel-specific power.",
        category: "strength", goal: "Build functional strength", difficulty: "advanced", sport: "both",
        modules: ["Resistance Band Activation", "Squat Circuit", "Pull-Up & Row Circuit", "Rotational Power", "Yoga Recovery Flow"],
      },
      {
        title: "Wall Wizard Training",
        description: "Advanced wall play, rebounds, and angle creation from all positions.",
        category: "technique", goal: "Master wall play", difficulty: "advanced", sport: "padel",
        modules: ["Agility Ladder Warm-Up", "Wall Play Rebound", "Lob Defense Drill", "Drop Shot & Lob Combo", "Active Cool-Down Jog"],
      },
      {
        title: "Pro Match Simulation",
        description: "Full match simulation with tactical adjustments between sets.",
        category: "match_prep", goal: "Simulate real match pressure", difficulty: "advanced", sport: "both",
        modules: ["Dynamic Warm-Up", "Split-Step Footwork", "Point Construction Rally", "Pressure Point Practice", "Video Analysis Session", "Stretching Cool-Down"],
      },

      // RECOVERY & SPECIAL (4)
      {
        title: "Active Recovery Day",
        description: "Light movement and recovery for rest days between intense sessions.",
        category: "recovery", goal: "Maximize recovery", difficulty: "beginner", sport: "both",
        modules: ["Active Cool-Down Jog", "Foam Rolling Recovery", "Yoga Recovery Flow", "Static Stretching Routine"],
      },
      {
        title: "Mental Game Booster",
        description: "Sharpen mental edge with visualization, journaling, and focus drills.",
        category: "mental", goal: "Strengthen mental game", difficulty: "intermediate", sport: "both",
        modules: ["Match Visualization", "Pressure Point Practice", "Video Analysis Session"],
      },
      {
        title: "Video Review & Analysis",
        description: "Deep dive into match footage with tactical breakdown.",
        category: "analysis", goal: "Tactical improvement", difficulty: "intermediate", sport: "both",
        modules: ["Video Analysis Session"],
      },
      {
        title: "Quick 30-Min Express",
        description: "High-intensity short session when time is limited.",
        category: "express", goal: "Efficient training", difficulty: "intermediate", sport: "both",
        modules: ["Agility Ladder Warm-Up", "Tabata Core", "Stretching Cool-Down"],
      },
    ];

    const created: string[] = [];

    for (const block of blocks) {
      // Check if block already exists
      const { data: existing } = await admin
        .from("training_blocks")
        .select("id")
        .eq("title", block.title)
        .eq("is_system", true)
        .maybeSingle();

      if (existing) {
        created.push(`⏭ ${block.title} already exists`);
        continue;
      }

      // Resolve module IDs, durations, and notes
      const moduleIds: string[] = [];
      const moduleDurations: number[] = [];
      const moduleNotes: string[] = [];
      let totalDuration = 0;

      for (const title of block.modules) {
        const mod = findModule(title);
        if (mod) {
          moduleIds.push(mod.id);
          moduleDurations.push(mod.duration_minutes || 15);
          moduleNotes.push("");
          totalDuration += mod.duration_minutes || 15;
        }
      }

      const { error: blockErr } = await admin.from("training_blocks").insert({
        title: block.title,
        description: block.description,
        category: block.category,
        goal: block.goal,
        difficulty: block.difficulty,
        sport: block.sport,
        duration_minutes: totalDuration,
        is_system: true,
        is_custom: false,
        is_public: true,
        coach_id: null,
        module_ids: moduleIds,
        module_durations: moduleDurations,
        module_notes: moduleNotes,
      });

      if (blockErr) {
        created.push(`❌ ${block.title}: ${blockErr.message}`);
      } else {
        created.push(`✅ ${block.title} (${moduleIds.length}/${block.modules.length} modules, ${totalDuration}min)`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, blocks_processed: blocks.length, details: created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
