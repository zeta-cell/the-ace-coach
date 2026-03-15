import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Users, BookOpen, Calendar, ChevronRight, ShoppingBag, Mail, Check, X as XIcon } from "lucide-react";
import { format } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import IncomingBookings from "@/components/portal/IncomingBookings";
import { toast } from "sonner";

interface AssignedPlayer {
  player_id: string;
  full_name: string;
  avatar_url: string | null;
  playtomic_level: number | null;
  fitness_level: string | null;
}

interface CoachRequest {
  id: string;
  player_id: string;
  player_name: string;
  block_title: string | null;
  message: string | null;
  request_type: string;
  created_at: string;
}

interface UpcomingPlan {
  id: string;
  plan_date: string;
  player_name: string;
  item_count: number;
  start_time: string | null;
  program_author: string | null;
}

const CoachDashboard = () => {
  const { user, profile } = useAuth();
  const [players, setPlayers] = useState<AssignedPlayer[]>([]);
  const [moduleCount, setModuleCount] = useState(0);
  const [todayPlansCount, setTodayPlansCount] = useState(0);
  const [requests, setRequests] = useState<CoachRequest[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState({ published: 0, sales: 0, revenue: 0 });
  const [upcomingPlans, setUpcomingPlans] = useState<UpcomingPlan[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch assigned players
    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", user.id);

    const playerIds = assignments?.map((a) => a.player_id) || [];

    if (playerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", playerIds);

      const { data: playerProfiles } = await supabase
        .from("player_profiles")
        .select("user_id, playtomic_level, fitness_level")
        .in("user_id", playerIds);

      const ppMap = new Map(playerProfiles?.map((p) => [p.user_id, p]) || []);

      setPlayers(
        (profiles || []).map((p) => ({
          player_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          playtomic_level: ppMap.get(p.user_id)?.playtomic_level ?? null,
          fitness_level: ppMap.get(p.user_id)?.fitness_level ?? null,
        }))
      );
    }

    // Module count
    const { count } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id);
    setModuleCount(count || 0);

    // Today's plans + upcoming (next 7 days)
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const weekFromNow = format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd");
    const { count: plansCount } = await supabase
      .from("player_day_plans")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("plan_date", todayStr);
    setTodayPlansCount(plansCount || 0);

    // Upcoming plans with program credit
    const { data: upcomingData } = await supabase
      .from("player_day_plans")
      .select("id, plan_date, player_id, start_time")
      .eq("coach_id", user.id)
      .gte("plan_date", todayStr)
      .lte("plan_date", weekFromNow)
      .order("plan_date")
      .limit(5);

    if (upcomingData && upcomingData.length > 0) {
      const upPlayerIds = [...new Set(upcomingData.map(p => p.player_id))];
      const upPlanIds = upcomingData.map(p => p.id);
      const [upProfiles, upItems] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", upPlayerIds),
        supabase.from("player_day_plan_items").select("plan_id, block_id").in("plan_id", upPlanIds),
      ]);
      const upNameMap = new Map(upProfiles.data?.map(p => [p.user_id, p.full_name]) || []);
      const upCountMap = new Map<string, number>();
      const upBlockMap = new Map<string, string>();
      (upItems.data as any[])?.forEach((item: any) => {
        upCountMap.set(item.plan_id, (upCountMap.get(item.plan_id) || 0) + 1);
        if (item.block_id && !upBlockMap.has(item.plan_id)) upBlockMap.set(item.plan_id, item.block_id);
      });

      const uniqueBlockIds = [...new Set(upBlockMap.values())];
      let authorMap = new Map<string, string | null>();
      if (uniqueBlockIds.length > 0) {
        const { data: blocks } = await supabase.from("training_blocks")
          .select("id, author_name, author_id").in("id", uniqueBlockIds);
        blocks?.forEach(b => {
          if (b.author_id && b.author_id !== user.id) authorMap.set(b.id, b.author_name);
        });
      }

      setUpcomingPlans(upcomingData.map(p => ({
        id: p.id,
        plan_date: p.plan_date,
        player_name: upNameMap.get(p.player_id) || "Player",
        item_count: upCountMap.get(p.id) || 0,
        start_time: p.start_time || null,
        program_author: upBlockMap.has(p.id) ? (authorMap.get(upBlockMap.get(p.id)!) || null) : null,
      })));
    }

    // Fetch coaching requests
    const { data: reqData } = await supabase
      .from("coach_requests").select("id, player_id, block_id, message, request_type, created_at")
      .eq("coach_id", user.id).eq("status", "pending").order("created_at", { ascending: false });
    if (reqData && reqData.length > 0) {
      const playerIds = reqData.map((r) => r.player_id);
      const blockIds = reqData.filter((r) => r.block_id).map((r) => r.block_id);
      const [profilesR, blocksR] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", playerIds),
        blockIds.length > 0 ? supabase.from("training_blocks").select("id, title").in("id", blockIds) : { data: [] },
      ]);
      const nameMap = new Map(profilesR.data?.map((p) => [p.user_id, p.full_name]) || []);
      const blockMap = new Map((blocksR.data as any[])?.map((b: any) => [b.id, b.title]) || []);
      setRequests(reqData.map((r) => ({
        ...r,
        player_name: nameMap.get(r.player_id) || "Player",
        block_title: r.block_id ? blockMap.get(r.block_id) || null : null,
      })));
    }

    // Marketplace stats
    const { count: pubCount } = await supabase
      .from("training_blocks").select("id", { count: "exact", head: true })
      .eq("coach_id", user.id).eq("is_public", true);
    const { data: salesData } = await supabase
      .from("block_purchases").select("amount_paid, platform_fee")
      .eq("seller_id", user.id);
    setMarketplaceStats({
      published: pubCount || 0,
      sales: salesData?.length || 0,
      revenue: salesData?.reduce((s, p) => s + (Number(p.amount_paid) - Number(p.platform_fee || 0)), 0) || 0,
    });
  };

  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "COACH";

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl md:text-4xl text-foreground mb-6"
        >
          WELCOME, {firstName}
        </motion.h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link to="/coach/players" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <Users size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{players.length}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Players</p>
          </Link>
          <Link to="/coach/modules" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <BookOpen size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{moduleCount}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Modules</p>
          </Link>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{todayPlansCount}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Plans Today</p>
          </div>
        </div>

        {/* Recent players */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-foreground">YOUR PLAYERS</h2>
            <Link to="/coach/players" className="text-primary text-xs font-body hover:underline">View all</Link>
          </div>

          {players.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <Users size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No players assigned yet.</p>
              <p className="font-body text-xs text-muted-foreground mt-1">Ask your admin to assign players.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.slice(0, 5).map((player) => (
                <Link
                  key={player.player_id}
                  to={`/coach/players/${player.player_id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                    {player.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-foreground">{player.full_name}</p>
                    <p className="text-xs font-body text-muted-foreground">
                      {player.fitness_level || "—"} · Level {player.playtomic_level ?? "—"}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Coaching Requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                <Mail size={20} className="text-primary" /> COACHING REQUESTS
              </h2>
              <span className="text-xs font-body text-primary">{requests.length} pending</span>
            </div>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">{req.player_name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-foreground">{req.player_name}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {req.request_type === "guide_program" ? "Program guidance" : req.request_type === "book_session" ? "Session booking" : "Full coaching"}
                        {req.block_title && ` · ${req.block_title}`}
                      </p>
                    </div>
                  </div>
                  {req.message && <p className="text-xs font-body text-muted-foreground italic">"{req.message}"</p>}
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from("coach_requests").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", req.id);
                      await supabase.from("coach_player_assignments").insert({ coach_id: user!.id, player_id: req.player_id });
                      toast.success("Request accepted!");
                      setRequests((prev) => prev.filter((r) => r.id !== req.id));
                    }} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider flex items-center justify-center gap-1">
                      <Check size={12} /> ACCEPT
                    </button>
                    <button onClick={async () => {
                      await supabase.from("coach_requests").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", req.id);
                      toast.success("Request declined");
                      setRequests((prev) => prev.filter((r) => r.id !== req.id));
                    }} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider flex items-center justify-center gap-1">
                      <XIcon size={12} /> DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming Bookings */}
        <IncomingBookings />

        {/* Upcoming Plans */}
        {upcomingPlans.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2 mb-3">
              <Calendar size={20} className="text-primary" /> UPCOMING SESSIONS
            </h2>
            <div className="space-y-2">
              {upcomingPlans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="text-center min-w-[40px]">
                    <p className="font-display text-sm text-primary">{format(new Date(plan.plan_date + "T00:00:00"), "d")}</p>
                    <p className="font-display text-[9px] text-muted-foreground">{format(new Date(plan.plan_date + "T00:00:00"), "EEE").toUpperCase()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground">{plan.player_name}</p>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {plan.start_time?.slice(0, 5) || "—"} · {plan.item_count} modules
                    </p>
                    {plan.program_author && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-body text-[10px] text-muted-foreground">
                          Via program by {plan.program_author}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketplace Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary" /> MY MARKETPLACE
            </h2>
            <Link to="/coach/marketplace" className="text-primary text-xs font-body hover:underline">Manage →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">{marketplaceStats.published}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Published</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">{marketplaceStats.sales}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Sales</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">€{marketplaceStats.revenue.toFixed(0)}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default CoachDashboard;
