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

    // All blocks - both new ones and mappings for existing empty ones
    const blockDefinitions: Record<string, string[]> = {
      // === NEW BLOCKS (from Ace Academy) ===
      "Beginner Welcome Session": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Forehand Cross-Court Rally", "Serve + 1 Pattern", "Static Stretching Routine"],
      "First Steps: Court Movement": ["Resistance Band Activation", "Split-Step Footwork", "Cone Agility Circuit", "Net Approach & Volley", "Foam Rolling Recovery"],
      "Beginner Serve & Return": ["Shadow Court Warm-Up", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Active Cool-Down Jog"],
      "Beginner Full Day": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Forehand Cross-Court Rally", "Serve + 1 Pattern", "Core Stability Circuit", "Foam Rolling Recovery", "Pre-Match Nutrition Plan"],
      "Power Serve Session": ["Resistance Band Activation", "Serve + 1 Pattern", "Rotational Power", "Resistance Band Shoulders", "Static Stretching Routine"],
      "Defensive Wall Builder": ["Dynamic Warm-Up", "Lob Defense Drill", "Wall Play Rebound", "Backhand Slice & Drive", "Cone Agility Circuit", "Foam Rolling Recovery"],
      "Net Domination Drill": ["Agility Ladder Warm-Up", "Net Approach & Volley", "Volley Clinic", "Split-Step Footwork", "Yoga Recovery Flow"],
      "Tactical Match Prep": ["Shadow Court Warm-Up", "Point Construction Rally", "Pressure Point Practice", "Match Visualization", "Pre-Match Nutrition Plan"],
      "Speed & Agility Focus": ["Agility Ladder Warm-Up", "Spider Drill", "Cone Agility Circuit", "HIIT Court Circuit", "Stretching Cool-Down"],
      "Forehand & Backhand Tune-Up": ["Resistance Band Activation", "Forehand Cross-Court Rally", "Backhand Slice & Drive", "Core Stability Circuit", "Static Stretching Routine"],
      "Elite Competition Day": ["Dynamic Warm-Up", "Shadow Court Warm-Up", "Point Construction Rally", "4-Point Rotation Drill", "Pressure Point Practice", "Match Visualization", "Post-Match Recovery Meal"],
      "Smash & Overhead Mastery": ["Resistance Band Activation", "Bandeja & Vibora", "Smash Technique", "Wall Play Rebound", "Rotational Power", "Stretching Cool-Down"],
      "Endurance Beast Mode": ["Dynamic Warm-Up", "HIIT Court Circuit", "Point Construction Rally", "Jump Rope Circuit", "Foam Rolling Recovery"],
      "Strength & Power Day": ["Resistance Band Activation", "Squat Circuit", "Pull-Up & Row Circuit", "Rotational Power", "Yoga Recovery Flow"],
      "Wall Wizard Training": ["Agility Ladder Warm-Up", "Wall Play Rebound", "Lob Defense Drill", "Drop Shot & Lob Combo", "Active Cool-Down Jog"],
      "Pro Match Simulation": ["Dynamic Warm-Up", "Split-Step Footwork", "Point Construction Rally", "Pressure Point Practice", "Video Analysis Session", "Stretching Cool-Down"],
      "Active Recovery Day": ["Active Cool-Down Jog", "Foam Rolling Recovery", "Yoga Recovery Flow", "Static Stretching Routine"],
      "Mental Game Booster": ["Match Visualization", "Pressure Point Practice", "Video Analysis Session"],
      "Video Review & Analysis": ["Video Analysis Session"],
      "Quick 30-Min Express": ["Agility Ladder Warm-Up", "Tabata Core", "Stretching Cool-Down"],

      // === EXISTING EMPTY BLOCKS (populate with module_ids) ===
      "Elite Performance": ["Dynamic Warm-Up", "4-Point Rotation Drill", "Point Construction Rally", "HIIT Court Circuit", "Pressure Point Practice", "Stretching Cool-Down"],
      "First Steps in Padel": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Stretching Cool-Down"],
      "Cardio Endurance Base": ["Dynamic Warm-Up", "Jump Rope Circuit", "HIIT Court Circuit", "Core Stability Circuit", "Active Cool-Down Jog"],
      "Core Stability Session": ["Resistance Band Activation", "Core Stability Circuit", "Tabata Core", "Static Stretching Routine"],
      "Court Conditioning": ["Agility Ladder Warm-Up", "Spider Drill", "HIIT Court Circuit", "Core Stability Circuit", "Foam Rolling Recovery"],
      "Speed & Agility": ["Agility Ladder Warm-Up", "Spider Drill", "Cone Agility Circuit", "Split-Step Footwork", "Stretching Cool-Down"],
      "Strength & Power": ["Resistance Band Activation", "Squat Circuit", "Rotational Power", "Pull-Up & Row Circuit", "Foam Rolling Recovery"],
      "Strength & Power Training": ["Resistance Band Activation", "Squat Circuit", "Rotational Power", "Pull-Up & Row Circuit", "Yoga Recovery Flow"],
      "Advanced Court Movement": ["Agility Ladder Warm-Up", "Spider Drill", "Cone Agility Circuit", "Split-Step Footwork", "Stretching Cool-Down"],
      "Footwork & Agility Circuit": ["Agility Ladder Warm-Up", "Lateral Shuffle Drill", "Spider Drill", "Cone Agility Circuit", "Active Cool-Down Jog"],
      "Footwork Fundamentals": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Split-Step Footwork", "Cone Agility Circuit", "Stretching Cool-Down"],
      "Kids Fun Padel": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Active Cool-Down Jog"],
      "Kids Mini Tournament": ["Dynamic Warm-Up", "Forehand Cross-Court Rally", "Point Construction Rally", "Stretching Cool-Down"],
      "Kids Padel Introduction": ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Serve + 1 Pattern", "Active Cool-Down Jog"],
      "Kids Tennis Fundamentals": ["Dynamic Warm-Up", "Baseline Rally — Cross Court", "Serve Progression Drill", "Active Cool-Down Jog"],
      "Match Day Strategy": ["Shadow Court Warm-Up", "Point Construction Rally", "Pressure Point Practice", "Match Visualization", "Pre-Match Nutrition Plan"],
      "Pre-Match Warm-Up": ["Dynamic Warm-Up", "Shadow Court Warm-Up", "Split-Step Footwork", "Serve + 1 Pattern"],
      "Competition Mindset": ["Match Visualization", "Pressure Point Practice", "Video Analysis Session"],
      "Mental Focus & Visualization": ["Match Visualization", "Pressure Point Practice"],
      "Mental Toughness": ["Shadow Court Warm-Up", "Pressure Point Practice", "Match Visualization", "Video Analysis Session"],
      "Tournament Simulation Match": ["Dynamic Warm-Up", "Shadow Court Warm-Up", "Point Construction Rally", "4-Point Rotation Drill", "Pressure Point Practice", "Match Visualization"],
      "Video Analysis Review": ["Video Analysis Session"],
      "Active Recovery": ["Active Cool-Down Jog", "Foam Rolling Recovery", "Yoga Recovery Flow", "Static Stretching Routine"],
      "Cool-Down & Recovery": ["Active Cool-Down Jog", "Foam Rolling Recovery", "Static Stretching Routine"],
      "Nutrition & Pre-Match Prep": ["Pre-Match Nutrition Plan", "Post-Match Recovery Meal"],
      "Post-Match Recovery": ["Active Cool-Down Jog", "Foam Rolling Recovery", "Yoga Recovery Flow", "Post-Match Recovery Meal"],
      "Backhand Consistency Session": ["Resistance Band Activation", "Backhand Slice & Drive", "Forehand Cross-Court Rally", "Static Stretching Routine"],
      "Bandeja & Vibora Session": ["Shadow Court Warm-Up", "Bandeja & Vibora", "Smash Technique", "Stretching Cool-Down"],
      "Drop Shot & Touch Play": ["Shadow Court Warm-Up", "Drop Shot & Lob Combo", "Net Approach & Volley", "Active Cool-Down Jog"],
      "Forehand Power Builder": ["Resistance Band Activation", "Forehand Cross-Court Rally", "Rotational Power", "Core Stability Circuit", "Stretching Cool-Down"],
      "Glass Wall Specialist": ["Shadow Court Warm-Up", "Wall Play Rebound", "Lob Defense Drill", "4-Point Rotation Drill", "Stretching Cool-Down"],
      "Group Tactical Drill Session": ["Dynamic Warm-Up", "Point Construction Rally", "4-Point Rotation Drill", "Volley Clinic", "Stretching Cool-Down"],
      "Net Attack & Volleys": ["Agility Ladder Warm-Up", "Net Approach & Volley", "Volley Clinic", "Split-Step Footwork", "Active Cool-Down Jog"],
      "Padel Bandeja & Vibora": ["Shadow Court Warm-Up", "Bandeja & Vibora", "Smash Technique", "Rotational Power", "Stretching Cool-Down"],
      "Padel Wall Play Mastery": ["Agility Ladder Warm-Up", "Wall Play Rebound", "Lob Defense Drill", "4-Point Rotation Drill", "Foam Rolling Recovery"],
      "Serve & Return Clinic": ["Shadow Court Warm-Up", "Serve + 1 Pattern", "Forehand Cross-Court Rally", "Net Approach & Volley", "Active Cool-Down Jog"],
      "Volley Masterclass": ["Agility Ladder Warm-Up", "Volley Clinic", "Net Approach & Volley", "Split-Step Footwork", "Stretching Cool-Down"],
      "Padel Warm-Up Routine": ["Dynamic Warm-Up", "Shadow Court Warm-Up", "Split-Step Footwork"],
      "Tennis Warm-Up Routine": ["Dynamic Warm-Up", "Agility Ladder Warm-Up", "Lateral Shuffle Drill"],
    };

    // New block metadata for blocks that don't exist yet
    const newBlockMeta: Record<string, { description: string; category: string; goal: string; difficulty: string; sport: string }> = {
      "Beginner Welcome Session": { description: "Perfect first-day session covering basics of padel movement and grip.", category: "beginner", goal: "Learn fundamentals", difficulty: "beginner", sport: "padel" },
      "First Steps: Court Movement": { description: "Build court awareness and basic footwork patterns.", category: "beginner", goal: "Improve court movement", difficulty: "beginner", sport: "both" },
      "Beginner Serve & Return": { description: "Master the basics of serving and returning in padel.", category: "beginner", goal: "Build serve confidence", difficulty: "beginner", sport: "padel" },
      "Beginner Full Day": { description: "Complete beginner training: warm-up, drills, fitness, and recovery.", category: "beginner", goal: "Full beginner development", difficulty: "beginner", sport: "both" },
      "Power Serve Session": { description: "Develop a powerful and consistent serve with physical conditioning.", category: "power", goal: "Improve serve power & placement", difficulty: "intermediate", sport: "padel" },
      "Defensive Wall Builder": { description: "Train defensive shots, lobs, and wall play to become unbreakable.", category: "defense", goal: "Build defensive consistency", difficulty: "intermediate", sport: "padel" },
      "Net Domination Drill": { description: "Master the net position with volleys, approach shots, and finishing.", category: "net_play", goal: "Dominate the net", difficulty: "intermediate", sport: "padel" },
      "Tactical Match Prep": { description: "Prepare for competitive matches with point construction and mental focus.", category: "match_prep", goal: "Match day preparation", difficulty: "intermediate", sport: "both" },
      "Speed & Agility Focus": { description: "Explosive movement training for faster court coverage.", category: "speed", goal: "Increase court speed", difficulty: "intermediate", sport: "both" },
      "Forehand & Backhand Tune-Up": { description: "Refine groundstroke technique with focused drills.", category: "technique", goal: "Improve groundstrokes", difficulty: "intermediate", sport: "both" },
      "Elite Competition Day": { description: "Full competition-day simulation with physical and mental prep.", category: "competition", goal: "Peak match performance", difficulty: "advanced", sport: "both" },
      "Smash & Overhead Mastery": { description: "Perfect overhead shots including bandeja, víbora, and power smash.", category: "power", goal: "Master overhead shots", difficulty: "advanced", sport: "padel" },
      "Endurance Beast Mode": { description: "Push physical limits with sustained high-intensity training.", category: "endurance", goal: "Build match endurance", difficulty: "advanced", sport: "both" },
      "Strength & Power Day": { description: "Off-court strength session to build padel-specific power.", category: "strength", goal: "Build functional strength", difficulty: "advanced", sport: "both" },
      "Wall Wizard Training": { description: "Advanced wall play, rebounds, and angle creation from all positions.", category: "technique", goal: "Master wall play", difficulty: "advanced", sport: "padel" },
      "Pro Match Simulation": { description: "Full match simulation with tactical adjustments between sets.", category: "match_prep", goal: "Simulate real match pressure", difficulty: "advanced", sport: "both" },
      "Active Recovery Day": { description: "Light movement and recovery for rest days between intense sessions.", category: "recovery", goal: "Maximize recovery", difficulty: "beginner", sport: "both" },
      "Mental Game Booster": { description: "Sharpen mental edge with visualization, journaling, and focus drills.", category: "mental", goal: "Strengthen mental game", difficulty: "intermediate", sport: "both" },
      "Video Review & Analysis": { description: "Deep dive into match footage with tactical breakdown.", category: "analysis", goal: "Tactical improvement", difficulty: "intermediate", sport: "both" },
      "Quick 30-Min Express": { description: "High-intensity short session when time is limited.", category: "express", goal: "Efficient training", difficulty: "intermediate", sport: "both" },
    };

    const created: string[] = [];

    for (const [title, moduleTitles] of Object.entries(blockDefinitions)) {
      // Resolve modules
      const moduleIds: string[] = [];
      const moduleDurations: number[] = [];
      const moduleNotes: string[] = [];
      let totalDuration = 0;

      for (const mTitle of moduleTitles) {
        const mod = findModule(mTitle);
        if (mod) {
          moduleIds.push(mod.id);
          moduleDurations.push(mod.duration_minutes || 15);
          moduleNotes.push("");
          totalDuration += mod.duration_minutes || 15;
        }
      }

      if (moduleIds.length === 0) {
        created.push(`⚠ ${title}: no modules resolved`);
        continue;
      }

      // Check if this block exists
      const { data: existing } = await admin
        .from("training_blocks")
        .select("id, module_ids")
        .eq("title", title)
        .eq("is_system", true)
        .maybeSingle();

      if (existing) {
        // Update if module_ids is empty
        const hasModules = existing.module_ids && existing.module_ids.length > 0;
        if (!hasModules) {
          const { error } = await admin.from("training_blocks").update({
            module_ids: moduleIds,
            module_durations: moduleDurations,
            module_notes: moduleNotes,
            duration_minutes: totalDuration,
          }).eq("id", existing.id);

          if (error) {
            created.push(`❌ ${title}: ${error.message}`);
          } else {
            created.push(`🔄 ${title}: populated ${moduleIds.length} modules (${totalDuration}min)`);
          }
        } else {
          created.push(`⏭ ${title}: already has ${existing.module_ids.length} modules`);
        }
        continue;
      }

      // Insert new block
      const meta = newBlockMeta[title];
      if (!meta) {
        created.push(`⚠ ${title}: no metadata, skipping insert`);
        continue;
      }

      const { error: blockErr } = await admin.from("training_blocks").insert({
        title,
        description: meta.description,
        category: meta.category,
        goal: meta.goal,
        difficulty: meta.difficulty,
        sport: meta.sport,
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
        created.push(`❌ ${title}: ${blockErr.message}`);
      } else {
        created.push(`✅ ${title}: created with ${moduleIds.length} modules (${totalDuration}min)`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: Object.keys(blockDefinitions).length, details: created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
