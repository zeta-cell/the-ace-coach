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

    const ensureUser = async (email: string, fullName: string, role: "player" | "coach" | "admin", avatarUrl?: string) => {
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find((u: any) => u.email === email);
      if (found) {
        await admin.from("profiles").upsert(
          { user_id: found.id, full_name: fullName, email, avatar_url: avatarUrl || null },
          { onConflict: "user_id" }
        );
        if (role !== "player") {
          await admin.from("user_roles").upsert(
            { user_id: found.id, role },
            { onConflict: "user_id" }
          );
        } else {
          const { data: existingRole } = await admin.from("user_roles").select("id").eq("user_id", found.id).maybeSingle();
          if (!existingRole) {
            await admin.from("user_roles").insert({ user_id: found.id, role: "player" });
          }
        }
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
        created.push(`FAIL ${email}: ${error.message}`);
        return null;
      }

      const userId = data.user.id;
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

      await admin.from("profiles").upsert(
        { user_id: userId, full_name: fullName, email, avatar_url: avatarUrl || null },
        { onConflict: "user_id" }
      );

      created.push(`OK ${email} (${role})`);
      return userId;
    };

    // --- Create Users with avatar URLs ---
    const adminId = await ensureUser("admin@the-ace.academy", "Admin Ace", "admin", "https://i.pravatar.cc/300?img=68");
    const coach1Id = await ensureUser("coach.francisco@the-ace.academy", "Francisco López", "coach", "https://i.pravatar.cc/300?img=12");
    const coach2Id = await ensureUser("coach.miguel@the-ace.academy", "Miguel Santos", "coach", "https://i.pravatar.cc/300?img=59");

    const playerEmails = [
      { email: "player.anna@the-ace.academy", name: "Anna Müller", avatar: "https://i.pravatar.cc/300?img=5" },
      { email: "player.james@the-ace.academy", name: "James Wilson", avatar: "https://i.pravatar.cc/300?img=11" },
      { email: "player.sofia@the-ace.academy", name: "Sofia Petrov", avatar: "https://i.pravatar.cc/300?img=9" },
      { email: "player.lucas@the-ace.academy", name: "Lucas Dubois", avatar: "https://i.pravatar.cc/300?img=33" },
      { email: "player.maria@the-ace.academy", name: "María García", avatar: "https://i.pravatar.cc/300?img=25" },
      { email: "player.tom@the-ace.academy", name: "Tom Eriksson", avatar: "https://i.pravatar.cc/300?img=52" },
      { email: "player.chiara@the-ace.academy", name: "Chiara Rossi", avatar: "https://i.pravatar.cc/300?img=45" },
      { email: "player.alex@the-ace.academy", name: "Alex Novak", avatar: "https://i.pravatar.cc/300?img=53" },
    ];

    const playerIds: string[] = [];
    for (const p of playerEmails) {
      const id = await ensureUser(p.email, p.name, "player", p.avatar);
      if (id) playerIds.push(id);
    }

    // --- Seed player_profiles with realistic data ---
    const seedPlayerProfiles = [
      { volley: 72, forehand: 85, serve: 68, smash: 60, backhand: 75, lob: 55, left: 60, right: 40, fitness: "intermediate", hand: "right", level: 4.2, sport: "padel", club: "Club Deportivo Padel Madrid", city: "Madrid", goals: ["Improve net play", "Better serve consistency"], injuries: "Slight knee tendinitis" },
      { volley: 58, forehand: 70, serve: 80, smash: 75, backhand: 62, lob: 70, left: 45, right: 55, fitness: "advanced", hand: "right", level: 5.1, sport: "padel", club: "Real Club de Tenis Barcelona", city: "Barcelona", goals: ["Tournament preparation", "Smash technique"], injuries: null },
      { volley: 65, forehand: 60, serve: 55, smash: 50, backhand: 68, lob: 72, left: 55, right: 45, fitness: "beginner", hand: "left", level: 2.8, sport: "tennis", club: null, city: "Amsterdam", goals: ["Learn padel basics", "Improve fitness"], injuries: null },
      { volley: 80, forehand: 78, serve: 72, smash: 85, backhand: 70, lob: 60, left: 50, right: 50, fitness: "advanced", hand: "right", level: 5.8, sport: "both", club: "Padel Indoor Lisbon", city: "Lisbon", goals: ["Compete at national level", "Mental toughness"], injuries: "Recovered shoulder surgery" },
      { volley: 50, forehand: 65, serve: 60, smash: 55, backhand: 58, lob: 62, left: 40, right: 60, fitness: "intermediate", hand: "right", level: 3.5, sport: "padel", club: "Racket Club Valencia", city: "Valencia", goals: ["Consistent backhand", "Match fitness"], injuries: null },
      { volley: 68, forehand: 72, serve: 65, smash: 70, backhand: 64, lob: 58, left: 48, right: 52, fitness: "intermediate", hand: "right", level: 4.0, sport: "padel", club: "Stockholm Padel Center", city: "Stockholm", goals: ["Wall play", "Positioning"], injuries: null },
      { volley: 74, forehand: 80, serve: 70, smash: 65, backhand: 72, lob: 68, left: 52, right: 48, fitness: "advanced", hand: "right", level: 4.8, sport: "both", club: "Club Padel Roma", city: "Rome", goals: ["Improve volleys", "Competition mindset"], injuries: "Mild wrist strain" },
      { volley: 55, forehand: 62, serve: 58, smash: 52, backhand: 60, lob: 65, left: 45, right: 55, fitness: "beginner", hand: "left", level: 2.5, sport: "tennis", club: null, city: "Prague", goals: ["Transition to padel", "Build endurance"], injuries: null },
    ];

    for (let i = 0; i < playerIds.length; i++) {
      const s = seedPlayerProfiles[i % seedPlayerProfiles.length];
      await admin.from("player_profiles").upsert({
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
        goals: s.goals,
        injuries: s.injuries,
        club_name: s.club,
        club_location: s.city,
        preferred_sport: s.sport,
        nationality: ["DE", "GB", "NL", "PT", "ES", "SE", "IT", "CZ"][i % 8],
      }, { onConflict: "user_id" });
    }

    // --- Coach Profiles with rich data ---
    if (coach1Id) {
      await admin.from("coach_profiles").upsert({
        user_id: coach1Id,
        bio: "Former WPT player with 12 years of coaching experience. Specializing in advanced padel tactics, wall play mastery, and competitive match preparation. I've coached players from beginner to national level and believe in building complete athletes through structured, progressive training.",
        years_experience: 12,
        location_city: "Madrid",
        location_country: "Spain",
        nationality: "ES",
        languages: ["Spanish", "English", "Portuguese"],
        certifications: ["FEP Level 3", "WPT Coach Certificate", "Sports Science Degree"],
        specializations: ["Advanced tactics", "Wall play", "Tournament prep", "Smash technique"],
        coaching_style: "Structured and analytical — I use video analysis and data to track progress. Sessions are intense but always fun.",
        dominant_hand: "right",
        preferred_side: "right",
        playtomic_level: 7.2,
        volley_pct: 85, forehand_pct: 90, serve_pct: 80, smash_pct: 92, backhand_pct: 82, lob_pct: 75,
        racket_brand: "Bullpadel", racket_model: "Vertex 04", racket_type: "diamond",
        is_verified: true,
        badge_level: "expert",
        profile_slug: "francisco-lopez",
        response_time_hours: 2,
      }, { onConflict: "user_id" });
    }

    if (coach2Id) {
      await admin.from("coach_profiles").upsert({
        user_id: coach2Id,
        bio: "Passionate about developing young talent and helping recreational players fall in love with padel. My approach combines technical fundamentals with game-based learning. Every session is designed to be challenging, engaging, and memorable.",
        years_experience: 8,
        location_city: "Lisbon",
        location_country: "Portugal",
        nationality: "PT",
        languages: ["Portuguese", "English", "Spanish"],
        certifications: ["FPP Coach Level 2", "First Aid Certificate", "Fitness Trainer Level 1"],
        specializations: ["Beginners", "Youth development", "Fitness integration", "Group sessions"],
        coaching_style: "Game-based and encouraging — I believe in learning by playing. Lots of drills disguised as games.",
        dominant_hand: "right",
        preferred_side: "left",
        playtomic_level: 6.5,
        volley_pct: 78, forehand_pct: 82, serve_pct: 75, smash_pct: 80, backhand_pct: 76, lob_pct: 70,
        racket_brand: "Head", racket_model: "Delta Pro", racket_type: "round",
        is_verified: true,
        badge_level: "pro",
        profile_slug: "miguel-santos",
        response_time_hours: 4,
      }, { onConflict: "user_id" });
    }

    // --- Coach Packages ---
    if (coach1Id) {
      const packages1 = [
        { title: "Private Padel Session", session_type: "individual", sport: "padel", duration_minutes: 60, price_per_session: 75, description: "1-on-1 intensive padel coaching tailored to your level and goals.", auto_confirm: true },
        { title: "Semi-Private (2 players)", session_type: "group", sport: "padel", duration_minutes: 60, price_per_session: 50, max_group_size: 2, description: "Train with a partner — ideal for competitive pairs.", auto_confirm: false },
        { title: "Group Clinic (4 players)", session_type: "group", sport: "padel", duration_minutes: 90, price_per_session: 35, max_group_size: 4, min_participants: 2, pricing_type: "per_person", description: "High-energy group sessions with match-play drills.", is_recurring_group: true, recurring_day_of_week: 3, recurring_start_time: "18:00" },
        { title: "Match Analysis Session", session_type: "individual", sport: "padel", duration_minutes: 45, price_per_session: 60, description: "Video review of your recent match with tactical adjustments.", auto_confirm: true },
        { title: "Intensive 10-Session Pack", session_type: "individual", sport: "padel", duration_minutes: 60, price_per_session: 65, total_sessions: 10, description: "Commit to 10 sessions and save. Structured improvement plan included." },
      ];
      for (const pkg of packages1) {
        const { data: existing } = await admin.from("coach_packages").select("id").eq("coach_id", coach1Id).eq("title", pkg.title).maybeSingle();
        if (!existing) {
          await admin.from("coach_packages").insert({ coach_id: coach1Id, ...pkg });
        }
      }
    }

    if (coach2Id) {
      const packages2 = [
        { title: "Beginner Padel Intro", session_type: "individual", sport: "padel", duration_minutes: 60, price_per_session: 55, description: "Perfect first session — learn grip, stance, basic shots, and court rules.", auto_confirm: true },
        { title: "Kids Padel Group", session_type: "group", sport: "padel", duration_minutes: 60, price_per_session: 25, max_group_size: 6, min_participants: 3, pricing_type: "per_person", description: "Fun padel for kids aged 8-14. Games, drills, and mini-tournaments.", is_recurring_group: true, recurring_day_of_week: 6, recurring_start_time: "10:00" },
        { title: "Fitness & Padel Combo", session_type: "individual", sport: "padel", duration_minutes: 90, price_per_session: 70, description: "30 min fitness circuit + 60 min padel session. Total body workout." },
        { title: "Tennis to Padel Transition", session_type: "individual", sport: "both", duration_minutes: 60, price_per_session: 60, description: "Leverage your tennis skills to fast-track your padel game." },
      ];
      for (const pkg of packages2) {
        const { data: existing } = await admin.from("coach_packages").select("id").eq("coach_id", coach2Id).eq("title", pkg.title).maybeSingle();
        if (!existing) {
          await admin.from("coach_packages").insert({ coach_id: coach2Id, ...pkg });
        }
      }
    }

    // --- Coach Availability Slots ---
    if (coach1Id) {
      const { data: existingSlots } = await admin.from("coach_availability_slots").select("id").eq("coach_id", coach1Id).limit(1);
      if (!existingSlots?.length) {
        const slots = [];
        for (let day = 1; day <= 5; day++) { // Mon-Fri
          slots.push({ coach_id: coach1Id, day_of_week: day, start_time: "09:00", end_time: "12:00", is_recurring: true });
          slots.push({ coach_id: coach1Id, day_of_week: day, start_time: "15:00", end_time: "20:00", is_recurring: true });
        }
        slots.push({ coach_id: coach1Id, day_of_week: 6, start_time: "09:00", end_time: "14:00", is_recurring: true }); // Saturday
        await admin.from("coach_availability_slots").insert(slots);
      }
    }
    if (coach2Id) {
      const { data: existingSlots } = await admin.from("coach_availability_slots").select("id").eq("coach_id", coach2Id).limit(1);
      if (!existingSlots?.length) {
        const slots = [];
        for (let day = 1; day <= 6; day++) {
          slots.push({ coach_id: coach2Id, day_of_week: day, start_time: "08:00", end_time: "13:00", is_recurring: true });
          if (day <= 4) slots.push({ coach_id: coach2Id, day_of_week: day, start_time: "16:00", end_time: "21:00", is_recurring: true });
        }
        await admin.from("coach_availability_slots").insert(slots);
      }
    }

    // --- Assignments (all 8 players) ---
    if (coach1Id) {
      for (const pid of playerIds.slice(0, 5)) {
        await admin.from("coach_player_assignments").upsert(
          { coach_id: coach1Id, player_id: pid },
          { onConflict: "coach_id,player_id" }
        );
      }
    }
    if (coach2Id) {
      for (const pid of playerIds.slice(3)) {
        await admin.from("coach_player_assignments").upsert(
          { coach_id: coach2Id, player_id: pid },
          { onConflict: "coach_id,player_id" }
        );
      }
    }

    // --- Modules (comprehensive library) ---
    const moduleCategories = [
      // Warm-ups (4)
      { title: "Dynamic Warm-Up", category: "warm_up", duration: 10, difficulty: "beginner", desc: "Full-body activation with ladder drills and arm circles.", sport: "both" },
      { title: "Shadow Court Warm-Up", category: "warm_up", duration: 10, difficulty: "intermediate", desc: "Simulate match movements without ball — volleys, smashes, lobs.", sport: "both" },
      { title: "Resistance Band Activation", category: "warm_up", duration: 12, difficulty: "beginner", desc: "Band walks, monster walks, and shoulder activation.", sport: "both" },
      { title: "Agility Ladder Warm-Up", category: "warm_up", duration: 12, difficulty: "intermediate", desc: "In-out, lateral shuffle, and Icky shuffle patterns.", sport: "both" },

      // Padel drills (10)
      { title: "Forehand Cross-Court Rally", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Consistency drill focusing on depth and angle.", sport: "padel" },
      { title: "Bandeja & Vibora", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "Overhead defense shots from mid-court — the most important padel shots.", sport: "padel" },
      { title: "Net Approach & Volley", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Transition from baseline to net with volley finishing.", sport: "padel" },
      { title: "Lob Defense Drill", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Recovering lobs from back wall and counter-attacking.", sport: "padel" },
      { title: "Wall Play Rebound", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Using the back and side walls to create angles.", sport: "padel" },
      { title: "4-Point Rotation Drill", category: "padel_drill", duration: 25, difficulty: "advanced", desc: "Systematic coverage of all four court quadrants.", sport: "padel" },
      { title: "Volley Clinic", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Block volleys, drive volleys, and angled volleys at the net.", sport: "padel" },
      { title: "Smash Technique", category: "padel_drill", duration: 20, difficulty: "intermediate", desc: "Overhead smash mechanics from mid-court and back.", sport: "padel" },
      { title: "Point Construction Rally", category: "padel_drill", duration: 30, difficulty: "advanced", desc: "Build points systematically from defensive to offensive positions.", sport: "padel" },
      { title: "Serve + 1 Pattern", category: "padel_drill", duration: 15, difficulty: "beginner", desc: "Practice serve and immediately follow with a forehand or backhand.", sport: "padel" },

      // Tennis drills (10)
      { title: "Baseline Rally — Cross Court", category: "tennis_drill", duration: 20, difficulty: "intermediate", desc: "Consistent cross-court rallying with emphasis on depth and topspin.", sport: "tennis" },
      { title: "Serve Progression Drill", category: "tennis_drill", duration: 25, difficulty: "intermediate", desc: "Flat, slice, and kick serve practice with target zones.", sport: "tennis" },
      { title: "Approach Shot & Net Finish", category: "tennis_drill", duration: 20, difficulty: "intermediate", desc: "Hit approach shot, close to net, finish with volley or overhead.", sport: "tennis" },
      { title: "Return of Serve Practice", category: "tennis_drill", duration: 20, difficulty: "intermediate", desc: "Block returns, chip returns, and aggressive return positioning.", sport: "tennis" },
      { title: "Drop Shot & Lob Combo", category: "tennis_drill", duration: 15, difficulty: "advanced", desc: "Touch shots — alternating drop shots with defensive lobs.", sport: "tennis" },
      { title: "Two-Ball Passing Shot Drill", category: "tennis_drill", duration: 20, difficulty: "advanced", desc: "Coach feeds two balls — hit passing shots down the line and cross-court.", sport: "tennis" },
      { title: "First Strike Tennis", category: "tennis_drill", duration: 25, difficulty: "advanced", desc: "Serve + forehand inside-out pattern to dominate the first 3 shots.", sport: "tennis" },
      { title: "Backhand Slice & Drive", category: "tennis_drill", duration: 20, difficulty: "intermediate", desc: "Alternate between slice and topspin backhands to build variety.", sport: "tennis" },
      { title: "Doubles Net Play", category: "tennis_drill", duration: 20, difficulty: "intermediate", desc: "Poaching, I-formation, and reflex volleys for doubles players.", sport: "tennis" },
      { title: "Match Point Simulation", category: "tennis_drill", duration: 25, difficulty: "advanced", desc: "Play out points starting from 30-40 / 40-30 pressure scenarios.", sport: "tennis" },

      // Footwork (4)
      { title: "Split-Step Footwork", category: "footwork", duration: 15, difficulty: "intermediate", desc: "Reaction-based movement patterns at the net.", sport: "both" },
      { title: "Lateral Shuffle Drill", category: "footwork", duration: 12, difficulty: "beginner", desc: "Side-to-side court coverage with proper stance.", sport: "both" },
      { title: "Spider Drill", category: "footwork", duration: 15, difficulty: "advanced", desc: "Multi-directional cone drill simulating match movement.", sport: "both" },
      { title: "Cone Agility Circuit", category: "footwork", duration: 15, difficulty: "advanced", desc: "12-cone circuit covering all movement patterns.", sport: "both" },

      // Fitness (4)
      { title: "Core Stability Circuit", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Planks, Russian twists, and medicine ball throws.", sport: "both" },
      { title: "HIIT Court Circuit", category: "fitness", duration: 20, difficulty: "advanced", desc: "Burpees, jump squats, mountain climbers on court.", sport: "both" },
      { title: "Tabata Core", category: "fitness", duration: 8, difficulty: "intermediate", desc: "8 rounds of 20s max effort / 10s rest — core focused.", sport: "both" },
      { title: "Jump Rope Circuit", category: "fitness", duration: 15, difficulty: "intermediate", desc: "Basic, double-unders, and cross jumps — 5 sets.", sport: "both" },

      // Strength (4)
      { title: "Resistance Band Shoulders", category: "strength", duration: 12, difficulty: "beginner", desc: "Rotator cuff strengthening for injury prevention.", sport: "both" },
      { title: "Squat Circuit", category: "strength", duration: 15, difficulty: "intermediate", desc: "Goblet squats, jump squats, and split squats — 3 sets.", sport: "both" },
      { title: "Rotational Power", category: "strength", duration: 15, difficulty: "advanced", desc: "Medicine ball rotational throws for shot power.", sport: "both" },
      { title: "Pull-Up & Row Circuit", category: "strength", duration: 15, difficulty: "advanced", desc: "Pull-ups, TRX rows, and face pulls for back strength.", sport: "both" },

      // Mental (3)
      { title: "Match Visualization", category: "mental", duration: 10, difficulty: "beginner", desc: "Guided imagery for pressure-point scenarios.", sport: "both" },
      { title: "Pressure Point Practice", category: "mental", duration: 15, difficulty: "intermediate", desc: "Simulate high-pressure points (4-4, match point) in training.", sport: "both" },
      { title: "Video Analysis Session", category: "mental", duration: 20, difficulty: "intermediate", desc: "Watch own match footage and identify patterns.", sport: "both" },

      // Recovery (3)
      { title: "Foam Rolling Recovery", category: "recovery", duration: 10, difficulty: "beginner", desc: "Full-body myofascial release routine.", sport: "both" },
      { title: "Static Stretching Routine", category: "recovery", duration: 15, difficulty: "beginner", desc: "Full-body hold stretches — 30s per muscle group.", sport: "both" },
      { title: "Yoga Recovery Flow", category: "recovery", duration: 20, difficulty: "beginner", desc: "Yin yoga poses held 2-3 minutes for deep tissue release.", sport: "both" },

      // Cool-down (2)
      { title: "Active Cool-Down Jog", category: "cool_down", duration: 8, difficulty: "beginner", desc: "Light jog + walking + breathing exercises to bring heart rate down.", sport: "both" },
      { title: "Stretching Cool-Down", category: "cool_down", duration: 10, difficulty: "beginner", desc: "Quad, hamstring, hip flexor and shoulder stretches.", sport: "both" },

      // Nutrition (2)
      { title: "Pre-Match Nutrition Plan", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Timing carbs, protein, and hydration before play.", sport: "both" },
      { title: "Post-Match Recovery Meal", category: "nutrition", duration: 5, difficulty: "beginner", desc: "Optimal protein + carb ratio within 30-60 min after play.", sport: "both" },
    ];

    const moduleIdMap: Record<string, string> = {};
    const moduleCatMap: Record<string, string> = {};
    if (coach1Id) {
      for (const m of moduleCategories) {
        const { data: existing } = await admin
          .from("modules").select("id").eq("title", m.title).eq("created_by", coach1Id).maybeSingle();
        if (existing) {
          moduleIdMap[m.title] = existing.id;
          moduleCatMap[existing.id] = m.category;
        } else {
          const { data: inserted } = await admin.from("modules").insert({
            title: m.title, category: m.category, duration_minutes: m.duration,
            description: m.desc, created_by: coach1Id, is_shared: true, difficulty: m.difficulty || "intermediate",
            sport: m.sport || "both",
          }).select("id").single();
          if (inserted) {
            moduleIdMap[m.title] = inserted.id;
            moduleCatMap[inserted.id] = m.category;
          }
        }
      }
    }

    // --- Training Blocks for Marketplace ---
    if (coach1Id) {
      const blocks = [
        {
          title: "Padel Fundamentals — 4 Week Program",
          description: "A comprehensive beginner program covering all basic padel shots, court positioning, and match etiquette. Each week builds on the previous, starting with grip and stance through to basic match play.",
          category: "padel_drill", difficulty: "beginner", sport: "padel", goal: "Master padel basics in 4 weeks",
          duration_minutes: 60, week_count: 4, is_public: true, is_for_sale: true, price: 49,
          tags: ["beginner", "fundamentals", "4-week"], target_level: "beginner", target_sport: "padel",
        },
        {
          title: "Wall Play Mastery",
          description: "Advanced wall play techniques including back wall rebounds, double wall shots, and tactical use of glass. For players level 4.0+ looking to elevate their game.",
          category: "padel_drill", difficulty: "advanced", sport: "padel", goal: "Master wall play techniques",
          duration_minutes: 90, week_count: 3, is_public: true, is_for_sale: true, price: 69,
          tags: ["advanced", "walls", "tactics"], target_level: "advanced", target_sport: "padel",
        },
        {
          title: "Tournament Preparation — 6 Weeks",
          description: "Complete tournament prep: physical conditioning, match-play simulations, mental preparation, and tactical planning. Includes video analysis templates and recovery protocols.",
          category: "fitness", difficulty: "advanced", sport: "padel", goal: "Peak performance for competition",
          duration_minutes: 90, week_count: 6, is_public: true, is_for_sale: true, price: 99,
          tags: ["tournament", "competition", "elite"], target_level: "advanced", target_sport: "padel",
        },
        {
          title: "Net Domination Clinic",
          description: "Become unstoppable at the net. Covers volleys, bandeja, vibora, smash, and positioning drills. Perfect for intermediate players ready to control the net.",
          category: "padel_drill", difficulty: "intermediate", sport: "padel", goal: "Dominate net play",
          duration_minutes: 60, week_count: 3, is_public: true, is_for_sale: true, price: 59,
          tags: ["net play", "volleys", "smash"], target_level: "intermediate", target_sport: "padel",
        },
        {
          title: "Padel Fitness Bootcamp",
          description: "8-week athletic conditioning specifically designed for padel. Includes strength, agility, endurance, and flexibility training with on-court integration.",
          category: "fitness", difficulty: "intermediate", sport: "padel", goal: "Padel-specific athletic conditioning",
          duration_minutes: 45, week_count: 8, is_public: true, is_for_sale: true, price: 79,
          tags: ["fitness", "strength", "conditioning"], target_level: "intermediate", target_sport: "padel",
        },
      ];

      for (const block of blocks) {
        const { data: existing } = await admin.from("training_blocks").select("id").eq("title", block.title).eq("author_id", coach1Id).maybeSingle();
        if (!existing) {
          await admin.from("training_blocks").insert({
            ...block,
            author_id: coach1Id, author_name: "Francisco López", author_avatar_url: "https://i.pravatar.cc/300?img=12",
            coach_id: coach1Id, block_type: "multi_week", is_custom: false, is_system: false,
            module_ids: [], module_durations: [], module_notes: [],
            rating_avg: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
            rating_count: Math.floor(Math.random() * 20) + 3,
            times_used: Math.floor(Math.random() * 50) + 5,
          });
        }
      }
    }

    if (coach2Id) {
      const blocks2 = [
        {
          title: "Kids Padel Adventure — 6 Weeks",
          description: "Fun-first program for kids 8-14. Learn padel through games, mini-tournaments, and team challenges. Focus on coordination, basic shots, and sportsmanship.",
          category: "padel_drill", difficulty: "beginner", sport: "padel", goal: "Fun introduction to padel for kids",
          duration_minutes: 60, week_count: 6, is_public: true, is_for_sale: true, price: 39,
          tags: ["kids", "fun", "beginner"], target_level: "beginner", target_sport: "padel",
        },
        {
          title: "Tennis to Padel — Fast Track",
          description: "Designed for tennis players transitioning to padel. Learn wall play, positioning, and padel-specific shots while leveraging your existing racket skills.",
          category: "padel_drill", difficulty: "intermediate", sport: "both", goal: "Quick padel transition for tennis players",
          duration_minutes: 60, week_count: 4, is_public: true, is_for_sale: true, price: 55,
          tags: ["tennis", "transition", "crossover"], target_level: "intermediate", target_sport: "both",
        },
      ];

      for (const block of blocks2) {
        const { data: existing } = await admin.from("training_blocks").select("id").eq("title", block.title).eq("author_id", coach2Id).maybeSingle();
        if (!existing) {
          await admin.from("training_blocks").insert({
            ...block,
            author_id: coach2Id, author_name: "Miguel Santos", author_avatar_url: "https://i.pravatar.cc/300?img=59",
            coach_id: coach2Id, block_type: "multi_week", is_custom: false, is_system: false,
            module_ids: [], module_durations: [], module_notes: [],
            rating_avg: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
            rating_count: Math.floor(Math.random() * 15) + 2,
            times_used: Math.floor(Math.random() * 30) + 3,
          });
        }
      }
    }

    // --- Events ---
    if (coach1Id) {
      const events = [
        {
          title: "Spring Padel Tournament 2026",
          description: "Open tournament for all levels. Categories: Beginner, Intermediate, Advanced. Prizes include equipment vouchers and free coaching sessions. BBQ and drinks included!",
          event_type: "tournament", sport: "padel", start_datetime: new Date(Date.now() + 14 * 86400000).toISOString(),
          end_datetime: new Date(Date.now() + 14 * 86400000 + 8 * 3600000).toISOString(),
          max_participants: 32, price_per_person: 35, location_name: "Club Deportivo Padel Madrid",
          location_city: "Madrid", location_country: "Spain", location_address: "Calle de Serrano 45",
          skill_level: "all", age_group: "adults",
        },
        {
          title: "Wall Play Masterclass",
          description: "Intensive 3-hour workshop focused exclusively on wall play techniques. Limited to 8 players for maximum attention. Video analysis included.",
          event_type: "clinic", sport: "padel", start_datetime: new Date(Date.now() + 7 * 86400000).toISOString(),
          end_datetime: new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString(),
          max_participants: 8, price_per_person: 65, location_name: "Indoor Padel Center",
          location_city: "Madrid", location_country: "Spain", location_address: "Av. de la Constitución 12",
          skill_level: "intermediate", age_group: "adults",
        },
        {
          title: "Friday Evening Social Padel",
          description: "Casual round-robin format. Meet new players, have fun, and enjoy post-match drinks. All levels welcome!",
          event_type: "social", sport: "padel", start_datetime: new Date(Date.now() + 3 * 86400000).toISOString(),
          end_datetime: new Date(Date.now() + 3 * 86400000 + 3 * 3600000).toISOString(),
          max_participants: 16, price_per_person: 15, location_name: "Padel Club Centro",
          location_city: "Madrid", location_country: "Spain", location_address: "Plaza Mayor 8",
          skill_level: "all", age_group: "all",
        },
      ];

      for (const evt of events) {
        const { data: existing } = await admin.from("events").select("id").eq("title", evt.title).eq("coach_id", coach1Id).maybeSingle();
        if (!existing) {
          await admin.from("events").insert({ coach_id: coach1Id, ...evt, status: "published", current_participants: 0 });
        }
      }
    }

    if (coach2Id) {
      const events2 = [
        {
          title: "Kids Summer Padel Camp",
          description: "5-day summer camp for kids 8-14. Daily sessions include warm-up, technique, games, and mini-tournaments. Snacks and drinks provided!",
          event_type: "camp", sport: "padel", start_datetime: new Date(Date.now() + 30 * 86400000).toISOString(),
          end_datetime: new Date(Date.now() + 34 * 86400000).toISOString(),
          max_participants: 20, price_per_person: 199, location_name: "Lisbon Padel Academy",
          location_city: "Lisbon", location_country: "Portugal", location_address: "Rua do Padel 22",
          skill_level: "all", age_group: "kids",
        },
        {
          title: "Padel & Fitness Weekend",
          description: "2-day intensive combining padel training with fitness sessions. Saturday: technique & drills. Sunday: match play & recovery. Lunch included both days.",
          event_type: "clinic", sport: "padel", start_datetime: new Date(Date.now() + 21 * 86400000).toISOString(),
          end_datetime: new Date(Date.now() + 22 * 86400000).toISOString(),
          max_participants: 12, price_per_person: 120, location_name: "Cascais Padel Resort",
          location_city: "Cascais", location_country: "Portugal", location_address: "Av. Marginal 150",
          skill_level: "intermediate", age_group: "adults",
        },
      ];

      for (const evt of events2) {
        const { data: existing } = await admin.from("events").select("id").eq("title", evt.title).eq("coach_id", coach2Id).maybeSingle();
        if (!existing) {
          await admin.from("events").insert({ coach_id: coach2Id, ...evt, status: "published", current_participants: 0 });
        }
      }
    }

    // --- Bookings ---
    if (coach1Id && playerIds.length >= 3) {
      const { data: pkg } = await admin.from("coach_packages").select("id").eq("coach_id", coach1Id).eq("session_type", "individual").limit(1).single();
      if (pkg) {
        for (let i = 0; i < 3; i++) {
          const bookingDate = new Date();
          bookingDate.setDate(bookingDate.getDate() + i + 2);
          const dateStr = bookingDate.toISOString().split("T")[0];

          const { data: existing } = await admin.from("bookings").select("id").eq("player_id", playerIds[i]).eq("booking_date", dateStr).maybeSingle();
          if (!existing) {
            await admin.from("bookings").insert({
              player_id: playerIds[i], coach_id: coach1Id, package_id: pkg.id,
              booking_date: dateStr, start_time: `${10 + i}:00`, end_time: `${11 + i}:00`,
              total_price: 75, platform_fee: 7.5, coach_payout: 67.5,
              status: "confirmed", notes: i === 0 ? "Focus on forehand technique" : null,
            });
          }
        }
      }

      // Past completed bookings for reviews
      for (let i = 0; i < 4; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - (i + 1) * 7);
        const dateStr = pastDate.toISOString().split("T")[0];
        const pid = playerIds[i % playerIds.length];

        const { data: existing } = await admin.from("bookings").select("id").eq("player_id", pid).eq("booking_date", dateStr).maybeSingle();
        if (!existing) {
          await admin.from("bookings").insert({
            player_id: pid, coach_id: coach1Id,
            booking_date: dateStr, start_time: "10:00", end_time: "11:00",
            total_price: 75, platform_fee: 7.5, coach_payout: 67.5,
            status: "completed",
          });
        }
      }
    }

    // --- Reviews ---
    if (coach1Id) {
      const reviewData = [
        { rating: 5, comment: "Francisco is an incredible coach! His attention to detail and ability to break down complex techniques made a huge difference in my game. Highly recommend for anyone serious about improving." },
        { rating: 5, comment: "Best padel coaching I've experienced. The structured approach and video analysis really helped me understand my weaknesses. My wall play has improved dramatically." },
        { rating: 4, comment: "Great sessions, very professional. The only reason for 4 stars is that scheduling can sometimes be tricky due to high demand. But the quality of coaching is top-notch." },
        { rating: 5, comment: "I've been training with Francisco for 3 months and my Playtomic level went from 3.5 to 4.2. His tournament prep program is exceptional." },
        { rating: 4, comment: "Fantastic coach with deep knowledge of the game. Sessions are intense but always enjoyable. My smash technique has completely transformed." },
      ];

      for (let i = 0; i < reviewData.length && i < playerIds.length; i++) {
        const { data: existing } = await admin.from("reviews").select("id").eq("coach_id", coach1Id).eq("player_id", playerIds[i]).maybeSingle();
        if (!existing) {
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - (i + 1) * 10);
          await admin.from("reviews").insert({
            coach_id: coach1Id, player_id: playerIds[i],
            rating: reviewData[i].rating, comment: reviewData[i].comment,
            created_at: createdAt.toISOString(),
          });
        }
      }
    }

    if (coach2Id) {
      const reviewData2 = [
        { rating: 5, comment: "Miguel made my kids fall in love with padel! His energy and patience are amazing. The games-based approach keeps them engaged for the full hour." },
        { rating: 5, comment: "As a tennis player switching to padel, Miguel's transition program was perfect. He understood exactly which habits to keep and which to change." },
        { rating: 4, comment: "Really fun and effective sessions. Miguel creates a great atmosphere while still pushing you to improve. The fitness integration is a nice bonus." },
      ];

      for (let i = 0; i < reviewData2.length && i < playerIds.length; i++) {
        const pidIdx = (i + 3) % playerIds.length;
        const { data: existing } = await admin.from("reviews").select("id").eq("coach_id", coach2Id).eq("player_id", playerIds[pidIdx]).maybeSingle();
        if (!existing) {
          await admin.from("reviews").insert({
            coach_id: coach2Id, player_id: playerIds[pidIdx],
            rating: reviewData2[i].rating, comment: reviewData2[i].comment,
          });
        }
      }
    }

    // --- Payments ---
    const paymentTypes = ["camp", "monthly", "session", "annual", "other"] as const;
    const paymentStatuses = ["completed", "completed", "completed", "pending", "completed"] as const;
    const amounts = [450, 89, 75, 120, 450, 89, 65, 350, 89, 65, 450, 89, 120, 65, 45];

    for (let i = 0; i < 15 && i < playerIds.length * 3; i++) {
      const pid = playerIds[i % playerIds.length];
      const monthOffset = Math.floor(i / 3);
      const createdAt = new Date();
      createdAt.setMonth(createdAt.getMonth() - monthOffset);
      createdAt.setDate(Math.floor(Math.random() * 28) + 1);

      await admin.from("payments").insert({
        user_id: pid, amount: amounts[i % amounts.length],
        type: paymentTypes[i % paymentTypes.length],
        status: paymentStatuses[i % paymentStatuses.length],
        description: `Seed payment #${i + 1}`, currency: "EUR",
        created_at: createdAt.toISOString(),
      });
    }

    // --- Day Plans (more comprehensive) ---
    if (coach1Id) {
      const { data: mods } = await admin.from("modules").select("id").eq("created_by", coach1Id).limit(12);
      const modIds = mods?.map((m) => m.id) || [];

      for (let p = 0; p < Math.min(4, playerIds.length); p++) {
        for (let d = -2; d < 5; d++) {
          const planDate = new Date();
          planDate.setDate(planDate.getDate() + d);
          const dateStr = planDate.toISOString().split("T")[0];

          // Skip weekends
          if (planDate.getDay() === 0) continue;

          const { data: existingPlan } = await admin.from("player_day_plans").select("id").eq("player_id", playerIds[p]).eq("plan_date", dateStr).maybeSingle();
          if (!existingPlan && modIds.length >= 4) {
            const startHour = 9 + (p % 3) * 2;
            const { data: plan } = await admin.from("player_day_plans").insert({
              player_id: playerIds[p], coach_id: coach1Id, plan_date: dateStr,
              start_time: `${startHour}:00`, end_time: `${startHour + 1}:30`,
              notes: ["Net play focus", "Recovery day", "Match simulation", "Technique refinement", "Fitness + padel combo", "Wall play practice", "Serve & return"][Math.abs(d + 2) % 7],
              location_name: "Club Deportivo Padel Madrid",
              location_address: "Calle de Serrano 45",
            }).select("id").single();

            if (plan) {
              const startIdx = ((p + d + 10) * 3) % Math.max(modIds.length - 3, 1);
              const items = modIds.slice(startIdx, startIdx + 3).map((mid, idx) => ({
                plan_id: plan.id, module_id: mid, order_index: idx,
                coach_note: idx === 0 ? "Start with light intensity" : null,
                is_completed: d < 0,
                completed_at: d < 0 ? new Date().toISOString() : null,
              }));
              await admin.from("player_day_plan_items").insert(items);
            }
          }
        }
      }
    }

    // --- Leaderboard & Stats ---
    for (let i = 0; i < playerIds.length; i++) {
      const xp = Math.floor(Math.random() * 5000) + 200;
      const level = xp >= 4000 ? 'platinum' : xp >= 1500 ? 'gold' : xp >= 500 ? 'silver' : 'bronze';
      const name = playerEmails[i]?.name || "Player";

      await admin.from("user_stats").upsert({
        user_id: playerIds[i],
        total_xp: xp, current_level: level,
        total_sessions: Math.floor(Math.random() * 40) + 5,
        total_minutes: Math.floor(Math.random() * 2400) + 300,
        current_streak_days: Math.floor(Math.random() * 14),
        longest_streak_days: Math.floor(Math.random() * 30) + 5,
        total_coaches: i < 3 ? 1 : 2,
        raffle_tickets: Math.floor(Math.random() * 10),
        wallet_balance: Math.floor(Math.random() * 50),
      }, { onConflict: "user_id" });

      await admin.from("leaderboard").upsert({
        user_id: playerIds[i],
        display_name: name,
        avatar_url: playerEmails[i]?.avatar || null,
        total_xp: xp, current_level: level,
        total_sessions: Math.floor(Math.random() * 40) + 5,
        current_streak_days: Math.floor(Math.random() * 14),
        city: seedPlayerProfiles[i % seedPlayerProfiles.length]?.city || null,
      }, { onConflict: "user_id" });
    }

    // --- Notifications ---
    for (let i = 0; i < Math.min(3, playerIds.length); i++) {
      await admin.from("notifications").insert([
        { user_id: playerIds[i], title: "Training plan updated", body: "Coach Francisco updated your training plan for tomorrow. Check it out!", link: "/training" },
        { user_id: playerIds[i], title: "New event near you", body: "Spring Padel Tournament 2026 is now open for registration. Limited spots!", link: "/events" },
        { user_id: playerIds[i], title: "Level up!", body: `Congratulations! You've earned enough XP to reach a new level. Keep training!`, link: "/dashboard" },
      ]);
    }

    // --- Messages ---
    if (coach1Id && playerIds.length >= 2) {
      const convos = [
        { from: playerIds[0], to: coach1Id, messages: [
          { content: "Hi Francisco! I was wondering if we could focus on my backhand during our next session?", sender: "player" },
          { content: "Of course, Anna! I've noticed some room for improvement there too. I'll prepare some specific drills. Let's also work on your wrist position — it'll make a big difference.", sender: "coach" },
          { content: "That sounds great! Should I warm up with any specific exercises before we start?", sender: "player" },
          { content: "Yes! Do the resistance band shoulder warm-up and some wrist circles. I've added them to your plan for that day. See you on court!", sender: "coach" },
        ]},
        { from: playerIds[1], to: coach1Id, messages: [
          { content: "Coach, I've been practicing the serve technique you showed me. Feeling much more consistent!", sender: "player" },
          { content: "That's fantastic James! Upload a video when you can — I'd love to see your progress. We can fine-tune in our next session.", sender: "coach" },
        ]},
      ];

      for (const convo of convos) {
        for (let m = 0; m < convo.messages.length; m++) {
          const msg = convo.messages[m];
          const msgDate = new Date();
          msgDate.setHours(msgDate.getHours() - (convo.messages.length - m) * 3);
          
          const senderId = msg.sender === "player" ? convo.from : convo.to;
          const receiverId = msg.sender === "player" ? convo.to : convo.from;

          await admin.from("messages").insert({
            sender_id: senderId, receiver_id: receiverId,
            content: msg.content, created_at: msgDate.toISOString(),
            is_read: m < convo.messages.length - 1,
          });
        }
      }
    }

    // --- Player Rackets ---
    const racketData = [
      { brand: "Bullpadel", model: "Vertex 04 CTR", type: "diamond", grip_size: "4 1/4", string_brand: null, is_favorite: true },
      { brand: "Head", model: "Delta Motion", type: "round", grip_size: "4 3/8", string_brand: null, is_favorite: true },
      { brand: "Wilson", model: "Bela Pro v2", type: "diamond", grip_size: "4 1/4", string_brand: null, is_favorite: true },
      { brand: "Adidas", model: "Metalbone 3.3", type: "diamond", grip_size: "4 1/2", string_brand: null, is_favorite: true },
      { brand: "Nox", model: "AT10 Genius", type: "diamond", grip_size: "4 1/4", string_brand: null, is_favorite: true },
      { brand: "Babolat", model: "Viper Air", type: "mixed", grip_size: "4 3/8", string_brand: null, is_favorite: true },
      { brand: "Siux", model: "Diablo Revolution", type: "diamond", grip_size: "4 1/4", string_brand: null, is_favorite: true },
      { brand: "StarVie", model: "Metheora Warrior", type: "mixed", grip_size: "4 1/2", string_brand: null, is_favorite: true },
    ];

    for (let i = 0; i < playerIds.length; i++) {
      const r = racketData[i % racketData.length];
      const { data: existing } = await admin.from("player_rackets").select("id").eq("player_id", playerIds[i]).maybeSingle();
      if (!existing) {
        await admin.from("player_rackets").insert({ player_id: playerIds[i], ...r });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seed complete with rich data! Password for all test users: ${PASSWORD}`,
        details: created,
        counts: {
          players: playerIds.length,
          modules: Object.keys(moduleIdMap).length,
        },
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
