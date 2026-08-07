import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, UserMinus, CheckCircle2, Circle, Loader2, Search, Gauge } from "lucide-react";

export interface Attendee {
  registration_id: string;
  player_id: string;
  full_name: string;
  avatar_url: string | null;
  level: number | null;
  status: string;
  attended: boolean | null;
  added_by_coach: boolean;
  registered_at: string;
}

interface RosterPlayer {
  player_id: string;
  full_name: string;
  level: number | null;
}

interface Props {
  eventId: string;
  canManage: boolean;
  maxParticipants: number | null;
  minParticipants: number;
  levelMin: number | null;
  levelMax: number | null;
  onChanged?: () => void;
}

const levelBadge = (level: number | null) =>
  level == null ? "—" : level.toFixed(2).replace(/\.?0+$/, "");

const ClassAttendees = ({ eventId, canManage, maxParticipants, minParticipants, levelMin, levelMax, onChanged }: Props) => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_class_attendees", { _event_id: eventId });
    setAttendees((data || []) as Attendee[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const loadRoster = async () => {
    const { data } = await supabase.rpc("get_class_roster_candidates", { _event_id: eventId });
    setRoster((data || []) as RosterPlayer[]);
  };

  const openAdd = async () => {
    setAdding(true);
    await loadRoster();
  };

  const addPlayer = async (playerId: string) => {
    setBusy(playerId);
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      player_id: playerId,
      status: "registered",
      payment_status: "pending",
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Player added");
    load();
    onChanged?.();
  };

  const removePlayer = async (registrationId: string) => {
    setBusy(registrationId);
    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", registrationId);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Player removed");
    load();
    onChanged?.();
  };

  const toggleAttendance = async (a: Attendee) => {
    setBusy(a.registration_id);
    const next = !a.attended;
    const { error } = await supabase
      .from("event_registrations")
      .update({ attended: next, checked_in_at: next ? new Date().toISOString() : null })
      .eq("id", a.registration_id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const count = attendees.length;
  const needed = Math.max(minParticipants - count, 0);
  const alreadyIn = new Set(attendees.map((a) => a.player_id));
  const rosterFiltered = roster
    .filter((r) => !alreadyIn.has(r.player_id))
    .filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-2xl border border-border bg-card/60">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <Users size={14} className="text-primary" />
        <span className="font-display text-[11px] tracking-wider text-foreground">WHO'S COMING</span>
        <span className="font-body text-[11px] text-muted-foreground">
          {count}{maxParticipants ? `/${maxParticipants}` : ""} in
        </span>
        {needed > 0 && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-display text-[10px] tracking-wider text-amber-500">
            {needed} MORE TO START
          </span>
        )}
        {(levelMin != null || levelMax != null) && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">
            <Gauge size={10} /> LEVEL {levelBadge(levelMin)}–{levelBadge(levelMax)}
          </span>
        )}
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
        ) : count === 0 ? (
          <p className="px-4 py-6 text-center font-body text-sm text-muted-foreground">No one signed up yet — be the first.</p>
        ) : (
          attendees.map((a) => (
            <div key={a.registration_id} className="flex items-center gap-3 px-4 py-3">
              {a.avatar_url ? (
                <img src={a.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-display text-xs text-muted-foreground">
                  {a.full_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-foreground">{a.full_name}</p>
                <p className="font-body text-[11px] text-muted-foreground">
                  Level {levelBadge(a.level)}{a.added_by_coach ? " · added by coach" : ""}
                </p>
              </div>
              {canManage ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleAttendance(a)} disabled={busy === a.registration_id}
                    title={a.attended ? "Marked present" : "Mark present"}
                    className={`grid h-8 w-8 place-items-center rounded-lg ${a.attended ? "bg-emerald-500/15 text-emerald-500" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {a.attended ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>
                  <button onClick={() => removePlayer(a.registration_id)} disabled={busy === a.registration_id}
                    title="Remove from class"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-destructive">
                    <UserMinus size={14} />
                  </button>
                </div>
              ) : a.attended ? (
                <CheckCircle2 size={15} className="text-emerald-500" />
              ) : null}
            </div>
          ))
        )}
      </div>

      {canManage && (
        <div className="border-t border-border p-3">
          {!adding ? (
            <button onClick={openAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 font-display text-[10px] tracking-wider text-foreground hover:bg-secondary/70">
              <UserPlus size={13} /> ADD A PLAYER
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
                <Search size={13} className="text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your players…"
                  className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                <button onClick={() => { setAdding(false); setSearch(""); }} className="font-display text-[10px] tracking-wider text-muted-foreground">CLOSE</button>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {rosterFiltered.length === 0 ? (
                  <p className="py-3 text-center font-body text-xs text-muted-foreground">No players left to add.</p>
                ) : rosterFiltered.map((r) => (
                  <button key={r.player_id} onClick={() => addPlayer(r.player_id)} disabled={busy === r.player_id}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-secondary">
                    <span className="flex-1 truncate font-body text-sm text-foreground">{r.full_name}</span>
                    <span className="font-body text-[11px] text-muted-foreground">Lvl {levelBadge(r.level)}</span>
                    {busy === r.player_id ? <Loader2 size={12} className="animate-spin text-muted-foreground" /> : <UserPlus size={13} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassAttendees;
