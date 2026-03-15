import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import UserDetailDrawer from "@/components/portal/UserDetailDrawer";

type AppRole = "player" | "coach" | "admin";
type BadgeLevel = "starter" | "pro" | "elite" | "legend";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  role: AppRole;
  badge_level?: BadgeLevel;
  is_verified?: boolean;
}

const ROLE_COLORS: Record<AppRole, string> = {
  player: "bg-blue-500/10 text-blue-400",
  coach: "bg-purple-500/10 text-purple-400",
  admin: "bg-primary/10 text-primary",
};

const BADGE_COLORS: Record<BadgeLevel, string> = {
  starter: "bg-secondary text-muted-foreground",
  pro: "bg-chart-2/20 text-chart-2",
  elite: "bg-chart-4/20 text-chart-4",
  legend: "bg-primary/20 text-primary",
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const roleParam = searchParams.get("role") as AppRole | null;
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">(roleParam || "all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setRoleFilter(roleParam || "all");
  }, [roleParam]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, is_active, created_at");

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const { data: coachData } = await supabase
      .from("coach_profiles")
      .select("user_id, badge_level, is_verified");

    const roleMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);
    const coachMap = new Map(
      (coachData || []).map((c: any) => [c.user_id, { badge_level: c.badge_level, is_verified: c.is_verified }])
    );

    const allUsers: UserRow[] = (profilesData || []).map((p) => {
      const role = (roleMap.get(p.user_id) as AppRole) || "player";
      const coachInfo = coachMap.get(p.user_id);
      return {
        user_id: p.user_id,
        full_name: p.full_name || "No name",
        email: p.email || "",
        is_active: p.is_active,
        created_at: p.created_at,
        role,
        badge_level: role === "coach" ? (coachInfo?.badge_level || "starter") : undefined,
        is_verified: role === "coach" ? (coachInfo?.is_verified || false) : undefined,
      };
    });

    setUsers(allUsers);
    setLoading(false);
  };

  const handleUserClick = (u: UserRow) => {
    setSelectedUser(u);
    setDrawerOpen(true);
  };

  const handleUserUpdate = (userId: string, updates: Partial<UserRow>) => {
    setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, ...updates } : u)));
    setSelectedUser((prev) => prev && prev.user_id === userId ? { ...prev, ...updates } : prev);
  };

  const changeRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });
    if (error) { toast.error("Failed to change role"); return; }
    toast.success(`Role changed to ${newRole}`);
    handleUserUpdate(userId, { role: newRole });
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: !currentActive } as any).eq("user_id", userId);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(currentActive ? "User deactivated" : "User activated");
    handleUserUpdate(userId, { is_active: !currentActive });
  };

  const changeBadgeLevel = async (userId: string, fullName: string, newBadge: BadgeLevel) => {
    const { error } = await supabase
      .from("coach_profiles")
      .update({ badge_level: newBadge })
      .eq("user_id", userId);
    if (error) { toast.error("Failed to update badge"); return; }
    toast.success(`Badge updated for ${fullName}`);
    handleUserUpdate(userId, { badge_level: newBadge });
  };

  const toggleVerified = async (userId: string, currentVerified: boolean) => {
    const { error } = await supabase
      .from("coach_profiles")
      .update({ is_verified: !currentVerified })
      .eq("user_id", userId);
    if (error) { toast.error("Failed to update verification"); return; }
    toast.success(!currentVerified ? "Coach verified" : "Verification removed");
    handleUserUpdate(userId, { is_verified: !currentVerified });
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-4">USER MANAGEMENT</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "player", "coach", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg font-body text-xs uppercase tracking-wider transition-colors ${
                  roleFilter === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/3" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-secondary rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u, i) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleUserClick(u)}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm shrink-0">
                    {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-foreground truncate">{u.full_name || "No name"}</p>
                      {u.role === "coach" && u.is_verified && (
                        <CheckCircle2 size={14} className="text-chart-2 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-body text-muted-foreground truncate">{u.email}</p>
                    <p className="text-[10px] font-body text-muted-foreground">
                      Joined {format(new Date(u.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {/* Badge level for coaches */}
                  {u.role === "coach" && (
                    <>
                      <select
                        value={u.badge_level || "starter"}
                        onChange={(e) => changeBadgeLevel(u.user_id, u.full_name, e.target.value as BadgeLevel)}
                        className={`px-2 py-1 rounded-lg font-body text-xs uppercase tracking-wider border-0 cursor-pointer ${BADGE_COLORS[u.badge_level || "starter"]}`}
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="elite">Elite</option>
                        <option value="legend">Legend</option>
                      </select>
                      <button
                        onClick={() => toggleVerified(u.user_id, u.is_verified || false)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.is_verified
                            ? "bg-chart-2/20 text-chart-2"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                        title={u.is_verified ? "Verified — click to remove" : "Not verified — click to verify"}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </>
                  )}

                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.user_id, e.target.value as AppRole)}
                    className={`px-2 py-1 rounded-lg font-body text-xs uppercase tracking-wider border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => toggleActive(u.user_id, u.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      u.is_active
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                    title={u.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}
                  >
                    {u.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                  </button>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <p className="font-body text-sm text-muted-foreground">No users found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <UserDetailDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUserUpdate={handleUserUpdate}
      />
    </PortalLayout>
  );
};

export default AdminUsers;
