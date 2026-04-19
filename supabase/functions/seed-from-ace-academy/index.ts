import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Module library (full set ported from Ace Academy seed-data) ──
const MODULES: { title: string; category: string; duration: number; difficulty: string; desc: string }[] = [
  // WARM UP
  { title: "Dynamic Warm-Up", category: "warm_up", duration: 10, difficulty: "beginner", desc: "Full-body activation with ladder drills and arm circles." },
  { title: "Joint Mobility Flow", category: "warm_up", duration: 8, difficulty: "beginner", desc: "Hip circles, shoulder rolls, ankle rotations for joint prep." },
  { title: "Cardio Activation Run", category: "warm_up", duration: 10, difficulty: "beginner", desc: "5-min jog + high knees + butt kicks around the court." },
  { title: "Resistance Band Warm-Up", category: "warm_up", duration: 12, difficulty: "beginner", desc: "Band walks, monster walks, and shoulder activation." },
  { title: "Shadow Padel Warm-Up", category: "warm_up", duration: 10, difficulty: "intermediate", desc: "Simulate padel movements without ball — volleys, smashes, lobs." },
  { title: "Sport-Specific Stretching", category: "warm_up", duration: 8, difficulty: "beginner", desc: "Hip flexor, thoracic spine, and calf stretches." },
  { title: "Agility Ladder Warm-Up", category: "warm_up", duration: 12, difficulty: "intermediate", desc: "In-out, lateral shuffle, and Icky shuffle patterns." },
  { title: "Breathing & Focus Activation", category: "warm_up", duration: 5, difficulty: "beginner", desc: "Box breathing + mental focus exercise before play." },
  { title: "Medicine Ball Warm-Up", category: "warm_up", duration: 10, difficulty: "intermediate", desc: "Rotational throws, chest passes, overhead slams for core activation." },
  { title: "Partner Toss Warm-Up", category: "warm_up", duration: 10, difficulty: "beginner", desc: "Simple catching/tossing drills to activate hand-eye coordination." },
  { title: "Plyometric Activation", category: "warm_up", duration: 10, difficulty: "intermediate", desc: "Jump rope, box jumps, and lateral bounds to activate fast-twitch fibers." },
  { title: "Wrist & Forearm Prep", category: "warm_up", duration: 6, difficulty: "beginner", desc: "Wrist circles, finger extensions, forearm stretches." },
  { title: "T-Drill Warm-Up", category: "warm_up", duration: 12, difficulty: "intermediate", desc: "Classic T-drill for directional change and acceleration." },
  { title: "Hip Activation Circuit", category: "warm_up", duration: 8, difficulty: "beginner", desc: "Clamshells, fire hydrants, and glute bridges." },
  { title: "Neural Activation Sprints", category: "warm_up", duration: 10, difficulty: "advanced", desc: "Short 5m bursts with direction changes to prime the nervous system." },
  // PADEL DRILL
  { title: "Forehand Cross-Court Rally", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Consistency drill focusing on depth and angle." },
  { title: "Bandeja & Vibora", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "Overhead defense shots from mid-court." },
  { title: "Net Approach & Volley", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Transition from baseline to net with volley finishing." },
  { title: "Lob Defense Drill", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Recovering lobs from back wall and counter-attacking." },
  { title: "Serve + 1 Pattern", category: "padel_drill", duration: 15, difficulty: "beginner", desc: "Practice serve and immediately follow with a forehand or backhand." },
  { title: "Wall Play Rebound", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Using the back and side walls to create angles." },
  { title: "4-Point Rotation Drill", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "Systematic coverage of all four court quadrants." },
  { title: "Volley Clinic", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Block volleys, drive volleys, and angled volleys at the net." },
  { title: "Backhand Slice Rally", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Controlled backhand slice with spin and placement." },
  { title: "Smash Technique", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Overhead smash mechanics from mid-court and back." },
  { title: "Drop Shot & Lob Combo", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "Deceptive drop shot followed by defensive lob recovery." },
  { title: "Cross-Court Backhand", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Backhand cross-court consistency with depth control." },
  { title: "Net Rush Drill", category: "padel_drill", duration: 15, difficulty: "intermediate", desc: "Aggressive net approach after short ball situations." },
  { title: "Side Wall Angles", category: "padel_drill", duration: 20, difficulty: "advanced", desc: "Exploiting side wall rebounds for winning angles." },
  { title: "Point Construction Rally", category: "padel_drill", duration: 30, difficulty: "advanced", desc: "Build points systematically from defensive to offensive positions." },
  { title: "Sarta Workshop 1 — Back Wall Foundation", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Di Nenno's base: master the back wall. Coach feeds 20 balls into back wall. Player exits with controlled backhand slice — flat, deep, body of opponent. 3 sets of 10 balls." },
  { title: "Sarta Workshop 2 — Wall Exit Under Immediate Pressure", category: "padel_drill", duration: 20, difficulty: "advanced", desc: "Back wall exit + immediate volley to feet. Decision: defensive lob OR low chiquita. No hesitation. 4 sets of 8 balls." },
  { title: "Sarta Workshop 3 — Pair Synchronization Under Attack", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "2v2. Attackers target Drive player. Defending pair moves as one unit. 10 consecutive points without a positional gap." },
  { title: "Sarta Workshop 4 — Full Intensity No Mercy", category: "padel_drill", duration: 20, difficulty: "advanced", desc: "Maximum intensity. NO lobs allowed. Coach increases pace every 2 minutes. Lose 5 points = session ends." },
  // FOOTWORK
  { title: "Split-Step Footwork", category: "footwork", duration: 15, difficulty: "intermediate", desc: "Reaction-based movement patterns at the net." },
  { title: "Lateral Shuffle Drill", category: "footwork", duration: 12, difficulty: "beginner", desc: "Side-to-side court coverage with proper stance." },
  { title: "Cross-Step Recovery", category: "footwork", duration: 15, difficulty: "intermediate", desc: "Crossing step technique for wide ball recovery." },
  { title: "Approach Step Pattern", category: "footwork", duration: 12, difficulty: "beginner", desc: "Small adjustment steps before striking the ball." },
  { title: "Backward Movement Drill", category: "footwork", duration: 12, difficulty: "intermediate", desc: "Safe and efficient backward movement for lob defense." },
  { title: "Spider Drill", category: "footwork", duration: 15, difficulty: "advanced", desc: "Multi-directional cone drill simulating match movement." },
  { title: "Reaction Cone Drill", category: "footwork", duration: 15, difficulty: "intermediate", desc: "Partner calls direction, player reacts and sprints." },
  { title: "Box Drill", category: "footwork", duration: 12, difficulty: "intermediate", desc: "Movement around a 2x2m box — forward, lateral, backward." },
  { title: "Hexagon Drill", category: "footwork", duration: 15, difficulty: "advanced", desc: "Jump in/out of hexagon pattern for agility and balance." },
  { title: "Figure-8 Footwork", category: "footwork", duration: 12, difficulty: "intermediate", desc: "Figure-8 pattern around two cones for change of direction." },
  { title: "Acceleration Bursts", category: "footwork", duration: 10, difficulty: "intermediate", desc: "Short 3-5 step explosive bursts in different directions." },
  { title: "Net-to-Baseline Sprint", category: "footwork", duration: 12, difficulty: "advanced", desc: "Full court transition sprints simulating match play." },
  { title: "Deceleration Control", category: "footwork", duration: 10, difficulty: "intermediate", desc: "Learning to brake and reset position safely." },
  { title: "Pivot & Push Drill", category: "footwork", duration: 12, difficulty: "intermediate", desc: "Pivot on back foot and push off for direction change." },
  { title: "Cone Agility Circuit", category: "footwork", duration: 15, difficulty: "advanced", desc: "12-cone circuit covering all movement patterns in padel." },
  // FITNESS
  { title: "Core Stability Circuit", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Planks, Russian twists, and medicine ball throws." },
  { title: "Interval Cardio", category: "fitness", duration: 20, difficulty: "intermediate", desc: "30s on / 30s off cycling: sprint, rest, repeat x10." },
  { title: "HIIT Court Circuit", category: "fitness", duration: 20, difficulty: "advanced", desc: "Burpees, jump squats, mountain climbers on court." },
  { title: "Aerobic Base Run", category: "fitness", duration: 30, difficulty: "beginner", desc: "Steady 30-min run at 65% max HR for aerobic base." },
  { title: "Tabata Core", category: "fitness", duration: 8, difficulty: "intermediate", desc: "8 rounds of 20s max effort / 10s rest — core focused." },
  { title: "Endurance Rally", category: "fitness", duration: 30, difficulty: "intermediate", desc: "Extended rallies to build on-court endurance." },
  { title: "Long Rally Endurance", category: "fitness", duration: 25, difficulty: "intermediate", desc: "Sustained baseline rallies for 25 minutes non-stop." },
  // STRENGTH
  { title: "Resistance Band Shoulders", category: "strength", duration: 12, difficulty: "beginner", desc: "Rotator cuff strengthening for injury prevention." },
  { title: "Squat Circuit", category: "strength", duration: 15, difficulty: "intermediate", desc: "Goblet squats, jump squats, and split squats — 3 sets." },
  { title: "Deadlift Fundamentals", category: "strength", duration: 20, difficulty: "intermediate", desc: "Romanian deadlift technique and progressive loading." },
  { title: "Lateral Band Walks", category: "strength", duration: 10, difficulty: "beginner", desc: "Glute and hip abductor strengthening with resistance band." },
  { title: "Core Anti-Rotation", category: "strength", duration: 12, difficulty: "intermediate", desc: "Pallof press and cable woodchops for rotational stability." },
  { title: "Pull-Up & Row Circuit", category: "strength", duration: 15, difficulty: "advanced", desc: "Pull-ups, TRX rows, and face pulls for back strength." },
  { title: "Rotational Power", category: "strength", duration: 15, difficulty: "advanced", desc: "Medicine ball rotational throws for shot power." },
  { title: "Shoulder Press Circuit", category: "strength", duration: 15, difficulty: "intermediate", desc: "Dumbbell shoulder press, lateral raises, front raises." },
  { title: "Hip Thrust", category: "strength", duration: 15, difficulty: "intermediate", desc: "Barbell/bodyweight hip thrusts for glute power." },
  // MENTAL
  { title: "Match Visualization", category: "mental", duration: 10, difficulty: "beginner", desc: "Guided imagery for pressure-point scenarios." },
  { title: "Pre-Match Routine", category: "mental", duration: 8, difficulty: "beginner", desc: "Consistent pre-match ritual for focus and confidence." },
  { title: "Pressure Point Practice", category: "mental", duration: 15, difficulty: "intermediate", desc: "Simulate high-pressure points (4-4, match point) in training." },
  { title: "Confidence Journaling", category: "mental", duration: 10, difficulty: "beginner", desc: "Write 3 strengths and 1 improvement after each session." },
  { title: "Reset Ritual", category: "mental", duration: 5, difficulty: "beginner", desc: "Between-point routine: bounce, breathe, bounce, serve." },
  { title: "Video Analysis Session", category: "mental", duration: 20, difficulty: "intermediate", desc: "Watch own match footage and identify patterns." },
  { title: "Competitor Analysis", category: "mental", duration: 15, difficulty: "intermediate", desc: "Study opponent patterns and plan tactical adjustments." },
  { title: "Focus Training", category: "mental", duration: 10, difficulty: "intermediate", desc: "Distraction tolerance drills — play through noise and pressure." },
  { title: "Goal Setting Session", category: "mental", duration: 15, difficulty: "beginner", desc: "Set process goals, performance goals, and outcome goals." },
  // RECOVERY
  { title: "Foam Rolling Recovery", category: "recovery", duration: 10, difficulty: "beginner", desc: "Full-body myofascial release routine." },
  { title: "Static Stretching Routine", category: "recovery", duration: 15, difficulty: "beginner", desc: "Full-body hold stretches — 30s per muscle group." },
  { title: "Ice Bath Protocol", category: "recovery", duration: 15, difficulty: "intermediate", desc: "10-12°C immersion for 10 minutes post-match." },
  { title: "Compression & Elevation", category: "recovery", duration: 20, difficulty: "beginner", desc: "Legs up wall + compression sleeves for circulation." },
  { title: "Active Recovery Walk", category: "recovery", duration: 20, difficulty: "beginner", desc: "Easy 20-min walk to flush lactic acid." },
  { title: "Contrast Shower", category: "recovery", duration: 10, difficulty: "beginner", desc: "Alternate hot/cold 1 min each x5 for recovery." },
  { title: "Yoga Recovery Flow", category: "recovery", duration: 20, difficulty: "beginner", desc: "Yin yoga poses held 2-3 minutes for deep tissue release." },
  { title: "Hydration & Nutrition Check", category: "recovery", duration: 5, difficulty: "beginner", desc: "Post-session: weigh in, rehydrate, refuel within 30 min." },
  // NUTRITION
  { title: "Pre-Match Nutrition Plan", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Timing carbs, protein, and hydration before play." },
  { title: "Post-Match Recovery Meal", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Optimal protein + carb ratio within 30-60 min after play." },
  { title: "Match Day Hydration", category: "nutrition", duration: 5, difficulty: "beginner", desc: "500ml on waking + electrolytes during warm-up." },
  // DEFENSIVE (mapped to padel_drill since no 'defense' enum value)
  { title: "Back Wall Exit — Forehand", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "M3 Academy: read the back wall rebound, exit with controlled forehand drive. Timing over power. 3 sets of 10." },
  { title: "Back Wall Exit — Backhand", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Mirror drill of forehand exit. Backhand slice off the back glass — low, flat trajectory." },
  { title: "Defensive Lob — Depth & Placement", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Pablo Crosetti method: lob as weapon, not escape. Target back corners with height and depth." },
  { title: "Resist 5 Volleys Drill", category: "padel_drill", duration: 15, difficulty: "advanced", desc: "Defenders return 5 consecutive aggressive volleys before losing the point. Builds defensive consistency." },
  { title: "Lob vs Smash Battle", category: "padel_drill", duration: 25, difficulty: "intermediate", desc: "One pair defends with lobs, other pair attacks with smashes. Switch after 10 points." },
  { title: "Defensive Wall Consistency", category: "padel_drill", duration: 20, difficulty: "beginner", desc: "Net player attacks, defender uses all walls. Defend, defend, defend. Builds wall reading and confidence." },
  { title: "Empty Space Targeting", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Trains defenders to hit gaps not covered by opposing pair — Rodrigo Ovide tactical session." },
];

const BLOCKS: { title: string; description: string; category: string; goal: string; difficulty: string; duration: number; modules: string[] }[] = [
  // BEGINNER
  { title: "Beginner Welcome Session", description: "Perfect first-day session covering basics of padel movement and grip.", category: "beginner", goal: "Learn fundamentals", difficulty: "beginner", duration: 60, modules: ["Dynamic Warm-Up", "Lateral Shuffle Drill", "Forehand Cross-Court Rally", "Serve + 1 Pattern", "Static Stretching Routine"] },
  { title: "First Steps: Court Movement", description: "Build court awareness and basic footwork patterns.", category: "beginner", goal: "Improve court movement", difficulty: "beginner", duration: 55, modules: ["Joint Mobility Flow", "Split-Step Footwork", "Approach Step Pattern", "Net Approach & Volley", "Foam Rolling Recovery"] },
  // INTERMEDIATE
  { title: "Power Serve Session", description: "Develop a powerful and consistent serve with physical conditioning.", category: "padel_drill", goal: "Improve serve power & placement", difficulty: "intermediate", duration: 75, modules: ["Medicine Ball Warm-Up", "Serve + 1 Pattern", "Rotational Power", "Shoulder Press Circuit", "Static Stretching Routine"] },
  { title: "Net Domination Drill", description: "Master the net position with volleys, approach shots, and finishing.", category: "padel_drill", goal: "Dominate the net", difficulty: "intermediate", duration: 70, modules: ["Agility Ladder Warm-Up", "Net Approach & Volley", "Volley Clinic", "Net Rush Drill", "Split-Step Footwork", "Yoga Recovery Flow"] },
  { title: "Tactical Match Prep", description: "Prepare for competitive matches with point construction and mental focus.", category: "padel_drill", goal: "Match day preparation", difficulty: "intermediate", duration: 85, modules: ["Shadow Padel Warm-Up", "Point Construction Rally", "Pressure Point Practice", "Pre-Match Routine", "Match Visualization", "Pre-Match Nutrition Plan"] },
  { title: "Speed & Agility Focus", description: "Explosive movement training for faster court coverage.", category: "footwork", goal: "Increase court speed", difficulty: "intermediate", duration: 65, modules: ["Plyometric Activation", "Spider Drill", "Reaction Cone Drill", "Acceleration Bursts", "HIIT Court Circuit", "Contrast Shower"] },
  // ADVANCED
  { title: "Smash & Overhead Mastery", description: "Perfect overhead shots including bandeja, víbora, and power smash.", category: "padel_drill", goal: "Master overhead shots", difficulty: "advanced", duration: 80, modules: ["Medicine Ball Warm-Up", "Bandeja & Vibora", "Smash Technique", "Side Wall Angles", "Rotational Power", "Compression & Elevation"] },
  { title: "Wall Wizard Training", description: "Advanced wall play, rebounds, and angle creation from all positions.", category: "padel_drill", goal: "Master wall play", difficulty: "advanced", duration: 75, modules: ["T-Drill Warm-Up", "Wall Play Rebound", "Side Wall Angles", "Lob Defense Drill", "Drop Shot & Lob Combo", "Active Recovery Walk"] },
  // RECOVERY & MENTAL
  { title: "Mental Game Booster", description: "Sharpen mental edge with visualization, journaling, and focus drills.", category: "mental", goal: "Strengthen mental game", difficulty: "intermediate", duration: 55, modules: ["Breathing & Focus Activation", "Match Visualization", "Confidence Journaling", "Goal Setting Session", "Video Analysis Session", "Reset Ritual"] },
  // SARTA / DEFENSIVE
  { title: "Sarta Defensive Session — Di Nenno Method", description: "Drive position defensive mastery: wall control, pressure decisions, pair sync, max intensity. Based on Sarta's coaching with Martin di Nenno.", category: "padel_drill", goal: "Master defensive Drive position", difficulty: "advanced", duration: 95, modules: ["Neural Activation Sprints", "Sarta Workshop 1 — Back Wall Foundation", "Sarta Workshop 2 — Wall Exit Under Immediate Pressure", "Sarta Workshop 3 — Pair Synchronization Under Attack", "Sarta Workshop 4 — Full Intensity No Mercy"] },
  { title: "Defensive Intelligence — Advanced", description: "For players who defend technically but give easy balls. Rodrigo Ovide methodology.", category: "padel_drill", goal: "Smarter defensive decision-making", difficulty: "advanced", duration: 80, modules: ["Shadow Padel Warm-Up", "Empty Space Targeting", "Resist 5 Volleys Drill", "Defensive Lob — Depth & Placement", "Pressure Point Practice", "Contrast Shower"] },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const log: string[] = [];
    let modulesAdded = 0;
    let blocksAdded = 0;

    // ── 1. Modules ──
    const { data: existingModules } = await admin.from("modules").select("id, title").eq("is_shared", true);
    const moduleByTitle = new Map<string, string>(existingModules?.map(m => [m.title, m.id]) || []);

    for (const m of MODULES) {
      if (moduleByTitle.has(m.title)) continue;
      const { data: inserted, error } = await admin.from("modules").insert({
        title: m.title,
        category: m.category,
        duration_minutes: m.duration,
        difficulty: m.difficulty,
        description: m.desc,
        player_description: m.desc,
        coach_description: m.desc,
        sport: "padel",
        is_shared: true,
        created_by: user.id,
      }).select("id").single();
      if (error) { log.push(`❌ module "${m.title}": ${error.message}`); continue; }
      moduleByTitle.set(m.title, inserted.id);
      modulesAdded++;
    }
    log.push(`📚 Modules: +${modulesAdded} added (${moduleByTitle.size} total shared)`);

    // ── 2. Training Blocks ──
    const { data: existingBlocks } = await admin.from("training_blocks").select("title").eq("is_system", true);
    const existingBlockTitles = new Set(existingBlocks?.map(b => b.title) || []);

    for (const b of BLOCKS) {
      if (existingBlockTitles.has(b.title)) continue;
      const ids: string[] = [], durs: number[] = [], notes: string[] = [];
      let totalDur = 0;
      for (const t of b.modules) {
        const id = moduleByTitle.get(t);
        if (!id) { log.push(`  ⚠ skipped module ref "${t}" in "${b.title}"`); continue; }
        const m = MODULES.find(x => x.title === t);
        const d = m?.duration || 15;
        ids.push(id); durs.push(d); notes.push(""); totalDur += d;
      }
      if (ids.length === 0) { log.push(`❌ block "${b.title}": no modules resolved`); continue; }
      const { error } = await admin.from("training_blocks").insert({
        title: b.title,
        description: b.description,
        category: b.category,
        goal: b.goal,
        difficulty: b.difficulty,
        duration_minutes: totalDur || b.duration,
        sport: "padel",
        is_system: true,
        module_ids: ids,
        module_durations: durs,
        module_notes: notes,
      });
      if (error) { log.push(`❌ block "${b.title}": ${error.message}`); continue; }
      blocksAdded++;
    }
    log.push(`🏋️ Training blocks: +${blocksAdded} added`);

    return new Response(
      JSON.stringify({ success: true, modules_added: modulesAdded, blocks_added: blocksAdded, log }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
