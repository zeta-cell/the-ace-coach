import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Link2, Unlink, Search, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  coach_id: string;
  player_id: string;
  coach_name: string;
  player_name: string;
}

const AdminAssignments = () => {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<UserRow[]>([]);
  const [players, setPlayers] = useState<UserRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, email");

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);
    const nameMap = new Map(profilesData?.map((p) => [p.user_id, p.full_name]) || []);

    const allUsers = (profilesData || []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name || p.email || "Unknown",
      email: p.email,
      role: roleMap.get(p.user_id) || "player",
    }));

    setCoaches(allUsers.filter((u) => u.role === "coach"));
    setPlayers(allUsers.filter((u) => u.role === "player"));

    const { data: assigns } = await supabase.from("coach_player_assignments").select("*");
    setAssignments(
      (assigns || []).map((a) => ({
        id: a.id,
        coach_id: a.coach_id,
        player_id: a.player_id,
        coach_name: nameMap.get(a.coach_id) || "Unknown",
        player_name: nameMap.get(a.player_id) || "Unknown",
      }))
    );
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedCoach || !selectedPlayer) return;
    const exists = assignments.some((a) => a.coach_id === selectedCoach && a.player_id === selectedPlayer);
    if (exists) { toast.error("Already assigned"); return; }

    setSaving(true);
    const { error } = await supabase.from("coach_player_assignments").insert({
      coach_id: selectedCoach,
      player_id: selectedPlayer,
    });

    if (error) { toast.error("Assignment failed", { description: error.message }); setSaving(false); return; }

    await supabase.from("notifications").insert({
      user_id: selectedPlayer,
      title: "Coach assigned",
      body: "You have been assigned a new coach.",
      link: "/messages",
    });

    toast.success("Player assigned to coach");
    setSelectedCoach("");
    setSelectedPlayer("");
    setSaving(false);
    fetchData();
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("coach_player_assignments").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Assignment removed");
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  // Players not yet assigned to selected coach
  const availablePlayers = selectedCoach
    ? players.filter((p) => !assignments.some((a) => a.coach_id === selectedCoach && a.player_id === p.user_id))
    : players;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">COACH–PLAYER ASSIGNMENTS</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* New assignment form */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6 mb-6"
            >
              <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">NEW ASSIGNMENT</h2>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-xs font-body text-muted-foreground mb-1 block">Coach</label>
                  <select
                    value={selectedCoach}
                    onChange={(e) => setSelectedCoach(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                  >
                    <option value="">Select coach...</option>
                    {coaches.map((c) => (
                      <option key={c.user_id} value={c.user_id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <ArrowRight size={20} className="text-muted-foreground hidden sm:block shrink-0 mb-2" />
                <div className="flex-1 w-full">
                  <label className="text-xs font-body text-muted-foreground mb-1 block">Player</label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                  >
                    <option value="">Select player...</option>
                    {availablePlayers.map((p) => (
                      <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={!selectedCoach || !selectedPlayer || saving}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Link2 size={14} className="inline mr-1" />
                  {saving ? "ASSIGNING..." : "ASSIGN"}
                </button>
              </div>
            </motion.div>

            {/* Current assignments */}
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
              CURRENT ASSIGNMENTS ({assignments.length})
            </h2>
            {assignments.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <Users size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">No assignments yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-display text-xs">
                          {a.coach_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display text-sm text-foreground">{a.coach_name}</p>
                          <p className="text-[10px] font-body text-purple-400 uppercase">Coach</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-display text-xs">
                          {a.player_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display text-sm text-foreground">{a.player_name}</p>
                          <p className="text-[10px] font-body text-blue-400 uppercase">Player</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(a.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove assignment"
                    >
                      <Unlink size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminAssignments;
