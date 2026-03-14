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

    const PASSWORD = "AceAcademy2026!";
    const created: string[] = [];

    const ensureUser = async (email: string, fullName: string, role: "player" | "coach" | "admin") => {
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === email);
      if (found) {
      // Ensure profile and role exist (upsert)
        await admin.from("profiles").upsert(
          { user_id: found.id, full_name: fullName, email },
          { onConflict: "user_id" }
        );
        if (role !== "player") {
          await admin.from("user_roles").upsert(
            { user_id: found.id, role },
            { onConflict: "user_id" }
          );
        } else {
          // Ensure player has a role entry
          const { data: existingRole } = await admin.from("user_roles").select("id").eq("user_id", found.id).maybeSingle();
          if (!existingRole) {
            await admin.from("user_roles").insert({ user_id: found.id, role: "player" });
          }
        }
        // Ensure player_profiles exists for players
        if (role === "player") {
          await admin.from("player_profiles").upsert(
            { user_id: found.id },
            { onConflict: "user_id" }
          );
        }
        created.push(`⏭ ${email} already exists`);
        return found.id;
      }

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        created.push(`❌ ${email}: ${error.message}`);
        return null;
      }

      const userId = data.user.id;

      // FIX 5: wait for trigger, then upsert role
      await new Promise(resolve => setTimeout(resolve, 500));

      if (role !== "player") {
        await admin.from("user_roles").upsert(
          { user_id: userId, role },
          { onConflict: "user_id" }
        );
      }

      if (role === "coach") {
        await admin.from("coach_profiles").upsert(
          { user_id: userId },
          { onConflict: "user_id" }
        );
      }

      // Upsert profile to ensure it exists
      await admin.from("profiles").upsert(
        { user_id: userId, full_name: fullName, email },
        { onConflict: "user_id" }
      );

      created.push(`✅ ${email} (${role})`);
      return userId;
    };

    // --- Create Users ---
    const adminId = await ensureUser("admin@the-ace.academy", "Admin Ace", "admin");
    const coach1Id = await ensureUser("coach.francisco@the-ace.academy", "Francisco López", "coach");
    const coach2Id = await ensureUser("coach.miguel@the-ace.academy", "Miguel Santos", "coach");

    const playerEmails = [
      { email: "player.anna@the-ace.academy", name: "Anna Müller" },
      { email: "player.james@the-ace.academy", name: "James Wilson" },
      { email: "player.sofia@the-ace.academy", name: "Sofia Petrov" },
      { email: "player.lucas@the-ace.academy", name: "Lucas Dubois" },
      { email: "player.maria@the-ace.academy", name: "María García" },
    ];

    const playerIds: string[] = [];
    for (const p of playerEmails) {
      const id = await ensureUser(p.email, p.name, "player");
      if (id) playerIds.push(id);
    }

    // --- FIX 2: Seed player_profiles with realistic data ---
    const seedPlayerProfiles = [
      { volley: 72, forehand: 85, serve: 68, smash: 60, backhand: 75, lob: 55, left: 60, right: 40, fitness: "intermediate", hand: "right", level: 4.2 },
      { volley: 58, forehand: 70, serve: 80, smash: 75, backhand: 62, lob: 70, left: 45, right: 55, fitness: "advanced", hand: "right", level: 5.1 },
      { volley: 65, forehand: 60, serve: 55, smash: 50, backhand: 68, lob: 72, left: 55, right: 45, fitness: "beginner", hand: "left", level: 2.8 },
      { volley: 80, forehand: 78, serve: 72, smash: 85, backhand: 70, lob: 60, left: 50, right: 50, fitness: "advanced", hand: "right", level: 5.8 },
      { volley: 50, forehand: 65, serve: 60, smash: 55, backhand: 58, lob: 62, left: 40, right: 60, fitness: "intermediate", hand: "right", level: 3.5 },
    ];

    for (let i = 0; i < playerIds.length; i++) {
      const s = seedPlayerProfiles[i % seedPlayerProfiles.length];
      const { data: existingPP } = await admin
        .from("player_profiles")
        .select("user_id")
        .eq("user_id", playerIds[i])
        .maybeSingle();

      if (existingPP) {
        // Update with seed data
        await admin.from("player_profiles").update({
          dominant_hand: s.hand,
          fitness_level: s.fitness,
          years_playing: Math.floor(Math.random() * 8) + 1,
          playtomic_level: s.level,
          left_tendency_pct: s.left,
          right_tendency_pct: s.right,
          volley_pct: s.volley,
          forehand_pct: s.forehand,
          serve_pct: s.serve,
          smash_pct: s.smash,
          backhand_pct: s.backhand,
          lob_pct: s.lob,
          shot_data_source: "coach",
          goals: ["Improve net play", "Better fitness"],
        }).eq("user_id", playerIds[i]);
      } else {
        await admin.from("player_profiles").insert({
          user_id: playerIds[i],
          dominant_hand: s.hand,
          fitness_level: s.fitness,
          years_playing: Math.floor(Math.random() * 8) + 1,
          playtomic_level: s.level,
          left_tendency_pct: s.left,
          right_tendency_pct: s.right,
          volley_pct: s.volley,
          forehand_pct: s.forehand,
          serve_pct: s.serve,
          smash_pct: s.smash,
          backhand_pct: s.backhand,
          lob_pct: s.lob,
          shot_data_source: "coach",
          goals: ["Improve net play", "Better fitness"],
        });
      }
    }

    // --- Assignments ---
    if (coach1Id && playerIds.length >= 3) {
      for (const pid of playerIds.slice(0, 3)) {
        await admin.from("coach_player_assignments").upsert(
          { coach_id: coach1Id, player_id: pid },
          { onConflict: "coach_id,player_id" }
        );
      }
    }
    if (coach2Id && playerIds.length >= 5) {
      for (const pid of playerIds.slice(3, 5)) {
        await admin.from("coach_player_assignments").upsert(
          { coach_id: coach2Id, player_id: pid },
          { onConflict: "coach_id,player_id" }
        );
      }
    }

    // --- Modules (80+ across all categories) ---
    const moduleCategories = [
      // WARM UP (15)
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
      // PADEL DRILL (15)
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
      // FOOTWORK (15)
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
      // FITNESS (15)
      { title: "Core Stability Circuit", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Planks, Russian twists, and medicine ball throws." },
      { title: "Interval Cardio", category: "fitness", duration: 20, difficulty: "intermediate", desc: "30s on / 30s off cycling: sprint, rest, repeat x10." },
      { title: "HIIT Court Circuit", category: "fitness", duration: 20, difficulty: "advanced", desc: "Burpees, jump squats, mountain climbers on court." },
      { title: "Aerobic Base Run", category: "fitness", duration: 30, difficulty: "beginner", desc: "Steady 30-min run at 65% max HR for aerobic base." },
      { title: "Tabata Core", category: "fitness", duration: 8, difficulty: "intermediate", desc: "8 rounds of 20s max effort / 10s rest — core focused." },
      { title: "Endurance Rally", category: "fitness", duration: 30, difficulty: "intermediate", desc: "Extended rallies to build on-court endurance." },
      { title: "Agility & Cardio Combo", category: "fitness", duration: 20, difficulty: "advanced", desc: "Agility ladder + sprint intervals combined." },
      { title: "Bicycle Cardio", category: "fitness", duration: 20, difficulty: "beginner", desc: "Stationary or outdoor cycling for aerobic fitness." },
      { title: "Jump Rope Circuit", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Basic, double-unders, and cross jumps — 5 sets." },
      { title: "Reaction Ball Drill", category: "fitness", duration: 15, difficulty: "advanced", desc: "Unpredictable ball reactions to train reflexes and cardio." },
      { title: "Rowing Machine Intervals", category: "fitness", duration: 20, difficulty: "intermediate", desc: "500m hard / 1min rest x5 for full-body conditioning." },
      { title: "Stair Cardio", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Stair runs for explosive leg power and cardio." },
      { title: "Battle Ropes", category: "fitness", duration: 12, difficulty: "advanced", desc: "Alternating waves, slams, and circles — 30s on/off." },
      { title: "Long Rally Endurance", category: "fitness", duration: 25, difficulty: "intermediate", desc: "Sustained baseline rallies for 25 minutes non-stop." },
      { title: "Pool Recovery Cardio", category: "fitness", duration: 30, difficulty: "beginner", desc: "Low-impact swimming for active recovery and cardio." },
      // STRENGTH (15)
      { title: "Resistance Band Shoulders", category: "strength", duration: 12, difficulty: "beginner", desc: "Rotator cuff strengthening for injury prevention." },
      { title: "Squat Circuit", category: "strength", duration: 15, difficulty: "intermediate", desc: "Goblet squats, jump squats, and split squats — 3 sets." },
      { title: "Deadlift Fundamentals", category: "strength", duration: 20, difficulty: "intermediate", desc: "Romanian deadlift technique and progressive loading." },
      { title: "Bench Press", category: "strength", duration: 20, difficulty: "intermediate", desc: "Chest strength for powerful shots — 4 sets of 8." },
      { title: "Lateral Band Walks", category: "strength", duration: 10, difficulty: "beginner", desc: "Glute and hip abductor strengthening with resistance band." },
      { title: "Core Anti-Rotation", category: "strength", duration: 12, difficulty: "intermediate", desc: "Pallof press and cable woodchops for rotational stability." },
      { title: "Single-Leg Balance", category: "strength", duration: 10, difficulty: "beginner", desc: "Balance board and single-leg stands for ankle stability." },
      { title: "Pull-Up & Row Circuit", category: "strength", duration: 15, difficulty: "advanced", desc: "Pull-ups, TRX rows, and face pulls for back strength." },
      { title: "Rotational Power", category: "strength", duration: 15, difficulty: "advanced", desc: "Medicine ball rotational throws for shot power." },
      { title: "Lunge Matrix", category: "strength", duration: 12, difficulty: "intermediate", desc: "Forward, lateral, and reverse lunges — 3 directions x10." },
      { title: "Shoulder Press Circuit", category: "strength", duration: 15, difficulty: "intermediate", desc: "Dumbbell shoulder press, lateral raises, front raises." },
      { title: "Wrist Strengthening", category: "strength", duration: 10, difficulty: "beginner", desc: "Wrist curls, reverse curls, and rice bucket training." },
      { title: "Calf Raise & Jump", category: "strength", duration: 10, difficulty: "beginner", desc: "Single and double leg calf raises + ankle hops." },
      { title: "Hip Thrust", category: "strength", duration: 15, difficulty: "intermediate", desc: "Barbell/bodyweight hip thrusts for glute power." },
      { title: "Farmer's Carry", category: "strength", duration: 10, difficulty: "intermediate", desc: "Heavy dumbbell carry for grip, core, and total body strength." },
      // MENTAL (10)
      { title: "Match Visualization", category: "mental", duration: 10, difficulty: "beginner", desc: "Guided imagery for pressure-point scenarios." },
      { title: "Pre-Match Routine", category: "mental", duration: 8, difficulty: "beginner", desc: "Consistent pre-match ritual for focus and confidence." },
      { title: "Pressure Point Practice", category: "mental", duration: 15, difficulty: "intermediate", desc: "Simulate high-pressure points (4-4, match point) in training." },
      { title: "Mindfulness Meditation", category: "mental", duration: 10, difficulty: "beginner", desc: "10-min body scan meditation for focus and stress reduction." },
      { title: "Confidence Journaling", category: "mental", duration: 10, difficulty: "beginner", desc: "Write 3 strengths and 1 improvement after each session." },
      { title: "Reset Ritual", category: "mental", duration: 5, difficulty: "beginner", desc: "Between-point routine: bounce, breathe, bounce, serve." },
      { title: "Video Analysis Session", category: "mental", duration: 20, difficulty: "intermediate", desc: "Watch own match footage and identify patterns." },
      { title: "Competitor Analysis", category: "mental", duration: 15, difficulty: "intermediate", desc: "Study opponent patterns and plan tactical adjustments." },
      { title: "Focus Training", category: "mental", duration: 10, difficulty: "intermediate", desc: "Distraction tolerance drills — play through noise and pressure." },
      { title: "Goal Setting Session", category: "mental", duration: 15, difficulty: "beginner", desc: "Set process goals, performance goals, and outcome goals." },
      // RECOVERY (10)
      { title: "Foam Rolling Recovery", category: "recovery", duration: 10, difficulty: "beginner", desc: "Full-body myofascial release routine." },
      { title: "Static Stretching Routine", category: "recovery", duration: 15, difficulty: "beginner", desc: "Full-body hold stretches — 30s per muscle group." },
      { title: "Ice Bath Protocol", category: "recovery", duration: 15, difficulty: "intermediate", desc: "10-12°C immersion for 10 minutes post-match." },
      { title: "Compression & Elevation", category: "recovery", duration: 20, difficulty: "beginner", desc: "Legs up wall + compression sleeves for circulation." },
      { title: "Sleep Optimization", category: "recovery", duration: 5, difficulty: "beginner", desc: "Review sleep hygiene: 8hrs, dark room, no screens." },
      { title: "Active Recovery Walk", category: "recovery", duration: 20, difficulty: "beginner", desc: "Easy 20-min walk to flush lactic acid." },
      { title: "Massage Protocol", category: "recovery", duration: 30, difficulty: "beginner", desc: "Self-massage with lacrosse ball and foam roller." },
      { title: "Contrast Shower", category: "recovery", duration: 10, difficulty: "beginner", desc: "Alternate hot/cold 1 min each x5 for recovery." },
      { title: "Yoga Recovery Flow", category: "recovery", duration: 20, difficulty: "beginner", desc: "Yin yoga poses held 2-3 minutes for deep tissue release." },
      { title: "Hydration & Nutrition Check", category: "recovery", duration: 5, difficulty: "beginner", desc: "Post-session: weigh in, rehydrate, refuel within 30 min." },
      // NUTRITION (5)
      { title: "Pre-Match Nutrition Plan", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Timing carbs, protein, and hydration before play." },
      { title: "Post-Match Recovery Meal", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Optimal protein + carb ratio within 30-60 min after play." },
      { title: "Match Day Hydration", category: "nutrition", duration: 5, difficulty: "beginner", desc: "500ml on waking + electrolytes during warm-up." },
      { title: "Competition Week Nutrition", category: "nutrition", duration: 10, difficulty: "intermediate", desc: "Carb loading, protein maintenance, and timing strategy." },
      { title: "Supplement Review", category: "nutrition", duration: 10, difficulty: "intermediate", desc: "Review creatine, vitamin D, magnesium, and omega-3 protocols." },
      // VIDEO (1 - existing)
      { title: "Serve Technique Analysis", category: "video", duration: 15, difficulty: "intermediate", desc: "Frame-by-frame breakdown of serve mechanics." },
    ];

    if (coach1Id) {
      for (const m of moduleCategories) {
        const { data: existing } = await admin
          .from("modules")
          .select("id")
          .eq("title", m.title)
          .eq("created_by", coach1Id)
          .maybeSingle();

        if (!existing) {
          await admin.from("modules").insert({
            title: m.title,
            category: m.category,
            duration_minutes: m.duration,
            description: m.desc,
            created_by: coach1Id,
            is_shared: true,
            difficulty: m.difficulty || "intermediate",
          });
        }
      }
    }

    // --- Payments ---
    const paymentTypes = ["camp", "monthly", "session", "annual", "other"] as const;
    const paymentStatuses = ["completed", "completed", "completed", "pending", "completed"] as const;
    const amounts = [450, 89, 65, 120, 450, 89, 65, 350, 89, 65, 450, 89, 120, 65, 45];

    for (let i = 0; i < 15 && i < playerIds.length * 3; i++) {
      const pid = playerIds[i % playerIds.length];
      const monthOffset = Math.floor(i / 3);
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - monthOffset);
      createdAt.setDate(Math.floor(Math.random() * 28) + 1);

      await admin.from("payments").insert({
        user_id: pid,
        amount: amounts[i % amounts.length],
        type: paymentTypes[i % paymentTypes.length],
        status: paymentStatuses[i % paymentStatuses.length],
        description: `Seed payment #${i + 1}`,
        currency: "EUR",
        created_at: createdAt.toISOString(),
      });
    }

    // --- Day Plans ---
    if (coach1Id && playerIds.length >= 2) {
      const { data: mods } = await admin
        .from("modules")
        .select("id")
        .eq("created_by", coach1Id)
        .limit(6);
      const moduleIds = mods?.map((m) => m.id) || [];

      for (let p = 0; p < 2; p++) {
        for (let d = 0; d < 2; d++) {
          const planDate = new Date();
          planDate.setDate(planDate.getDate() + d);
          const dateStr = planDate.toISOString().split("T")[0];

          const { data: existingPlan } = await admin
            .from("player_day_plans")
            .select("id")
            .eq("player_id", playerIds[p])
            .eq("plan_date", dateStr)
            .maybeSingle();

          if (!existingPlan) {
            const { data: plan } = await admin
              .from("player_day_plans")
              .insert({
                player_id: playerIds[p],
                coach_id: coach1Id,
                plan_date: dateStr,
                notes: d === 0 ? "Focus on net play today" : "Recovery and technique day",
              })
              .select("id")
              .single();

            if (plan && moduleIds.length >= 4) {
              const items = moduleIds.slice(d * 2, d * 2 + 4).map((mid, idx) => ({
                plan_id: plan.id,
                module_id: mid,
                order_index: idx,
                coach_note: idx === 0 ? "Start slow, build intensity" : null,
              }));
              await admin.from("player_day_plan_items").insert(items);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seed complete. Password for all test users: ${PASSWORD}`,
        details: created,
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
