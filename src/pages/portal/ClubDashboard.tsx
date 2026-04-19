import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { Building2, Users, Calendar, Euro, Square, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const ClubDashboard = () => {
  const { activeClub, activeClubId, loading: clubLoading } = useClub();
  const [stats, setStats] = useState({
    coaches: 0,
    courts: 0,
    bookingsThisWeek: 0,
    revenueThisMonth: 0,
    followers: 0,
  });

  useEffect(() => {
    if (!activeClubId) return;
    (async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date();
      startOfMonth.setDate(1);

      const [coachesRes, courtsRes, bookingsRes, revenueRes, followersRes] = await Promise.all([
        supabase.from("club_coaches").select("id", { count: "exact", head: true }).eq("club_id", activeClubId),
        supabase.from("club_courts").select("id", { count: "exact", head: true }).eq("club_id", activeClubId).eq("is_active", true),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("club_id", activeClubId).gte("booking_date", startOfWeek.toISOString().split("T")[0]),
        supabase.from("bookings").select("total_price").eq("club_id", activeClubId).eq("status", "confirmed").gte("booking_date", startOfMonth.toISOString().split("T")[0]),
        supabase.from("club_followers").select("id", { count: "exact", head: true }).eq("club_id", activeClubId),
      ]);

      setStats({
        coaches: coachesRes.count || 0,
        courts: courtsRes.count || 0,
        bookingsThisWeek: bookingsRes.count || 0,
        revenueThisMonth: (revenueRes.data || []).reduce((sum, b: any) => sum + Number(b.total_price || 0), 0),
        followers: followersRes.count || 0,
      });
    })();
  }, [activeClubId]);

  if (clubLoading) {
    return <PortalLayout><div className="p-6">Loading…</div></PortalLayout>;
  }

  if (!activeClub) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
          <Building2 size={48} className="mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl tracking-wide text-foreground">No Club Yet</h1>
          <p className="font-body text-sm text-muted-foreground">
            You're not connected to a club. Create one to start managing coaches, courts, and centralized bookings.
          </p>
          <Link to="/club/settings" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-display text-sm tracking-wide">
            CREATE CLUB
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const cards = [
    { label: "Coaches", value: stats.coaches, icon: Users, href: "/club/coaches", color: "text-primary" },
    { label: "Courts", value: stats.courts, icon: Square, href: "/club/courts", color: "text-accent" },
    { label: "Bookings This Week", value: stats.bookingsThisWeek, icon: Calendar, href: "/club/bookings", color: "text-foreground" },
    { label: "Revenue (Month)", value: `€${stats.revenueThisMonth.toFixed(0)}`, icon: Euro, href: "/club/bookings", color: "text-foreground" },
    { label: "Followers", value: stats.followers, icon: Heart, href: "/club/coaches", color: "text-rose-400" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {activeClub.logo_url && <img src={activeClub.logo_url} alt={activeClub.club_name} className="w-12 h-12 rounded-lg" />}
          <div>
            <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">{activeClub.club_name}</h1>
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Club Command Center</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <Link key={c.label} to={c.href}>
              <Card className="p-5 hover:border-primary transition-colors">
                <c.icon className={`${c.color} mb-3`} size={24} />
                <div className="text-2xl font-display text-foreground">{c.value}</div>
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/club/coaches" className="px-4 py-3 bg-secondary rounded-lg text-sm font-body text-foreground hover:bg-secondary/70 transition-colors">
              + Invite Coach
            </Link>
            <Link to="/club/courts" className="px-4 py-3 bg-secondary rounded-lg text-sm font-body text-foreground hover:bg-secondary/70 transition-colors">
              + Add Court
            </Link>
            <Link to="/club/bookings" className="px-4 py-3 bg-secondary rounded-lg text-sm font-body text-foreground hover:bg-secondary/70 transition-colors">
              View All Bookings
            </Link>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ClubDashboard;
