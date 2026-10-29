import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Search, Users, Loader2 } from "lucide-react";

const SLOTS = 4;
const DURATION = 90;
const DEFAULT_TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"];

interface Court { id: string; court_number: string }
interface Coach { id: string; name: string; color: string }
interface Player { player_id: string; full_name: string; level: number | null }
interface Spot { reg_id: string; player_id: string; name: string }
interface Group { id: string; court_id: string; time: string; coach_id: string; title: string; players: Spot[] }

const addMin = (t: string, m: number) => {
  const [h, mm] = t.split(":").map(Number);
  const x = h * 60 + mm + m;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

interface Props { clubId: string; date: string; courts: Court[]; coaches: Coach[]; onChanged?: () => void }

const ClubCourtBoard = ({ clubId, date, courts, coaches, onChanged }: Props) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<{ court: Court; time: string; group?: Group } | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(`${date}T00:00`).toISOString();
    const to = new Date(new Date(`${date}T00:00`).getTime() + 86400000).toISOString();
    const { data: evs } = await supabase.from("events")
      .select("id, title, start_datetime, coach_id, court_id")
      .eq("club_id", clubId).not("court_id", "is", null)
      .gte("start_datetime", from).lt("start_datetime", to).neq("status", "cancelled");
    const ids = (evs || []).map((e) => e.id);
    const { data: regs } = ids.length
      ? await supabase.from("event_registrations").select("id, event_id, player_id, status").in("event_id", ids).neq("status", "cancelled")
      : { data: [] as { id: string; event_id: string; player_id: string; status: string | null }[] };
    const pids = Array.from(new Set((regs || []).map((r) => r.player_id)));
    const { data: profs } = pids.length ? await supabase.from("profiles").select("user_id, full_name").in("user_id", pids) : { data: [] };
    const nm = new Map((profs || []).map((p) => [p.user_id, p.full_name]));
    setGroups((evs || []).map((e) => {
      const d = new Date(e.start_datetime);
      return {
        id: e.id, court_id: e.court_id as string, coach_id: e.coach_id, title: e.title,
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        players: (regs || []).filter((r) => r.event_id === e.id).map((r) => ({ reg_id: r.id, player_id: r.player_id, name: nm.get(r.player_id) || "Player" })),
      };
    }));
    setLoading(false);
  }, [clubId, date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.rpc("get_club_player_candidates", { _club_id: clubId }).then(({ data }) => setPlayers((data || []) as Player[]));
  }, [clubId]);

  const times = useMemo(() => Array.from(new Set([...DEFAULT_TIMES, ...groups.map((g) => g.time)])).sort(), [groups]);
  const refresh = () => { load(); onChanged?.(); };
  const coachName = (id: string) => coaches.find((c) => c.id === id)?.name || "Coach";

  const ensureGroup = async (court: Court, time: string): Promise<string | null> => {
    const existing = groups.find((g) => g.court_id === court.id && g.time === time);
    if (existing) return existing.id;
    const coach = coaches[0]?.id;
    if (!coach) { toast({ title: "Add a coach to the club first", variant: "destructive" }); return null; }
    const { data, error } = await supabase.from("events").insert({
      coach_id: coach, club_id: clubId, court_id: court.id, court_number: court.court_number,
      title: `${court.court_number} · ${time}`, event_type: "group_class", sport: "padel",
      start_datetime: new Date(`${date}T${time}`).toISOString(),
      end_datetime: new Date(`${date}T${addMin(time, DURATION)}`).toISOString(),
      max_participants: SLOTS, min_participants: 1, status: "published", price_per_person: 0,
    }).select("id").single();
    if (error || !data) {
      toast({ title: "Could not create group", description: error?.message.includes("conflict") ? "That court is already booked at this time." : error?.message, variant: "destructive" });
      return null;
    }
    return data.id;
  };

  const addPlayer = async (p: Player) => {
    if (!target) return;
    const g = target.group;
    if (g && g.players.some((x) => x.player_id === p.player_id)) return;
    if (g && g.players.length >= SLOTS) { toast({ title: "This court is full (4 players)" }); return; }
    setBusy(true);
    const id = await ensureGroup(target.court, target.time);
    if (!id) { setBusy(false); return; }
    const { error } = await supabase.from("event_registrations").insert({ event_id: id, player_id: p.player_id, status: "registered", payment_status: "pending" });
    setBusy(false);
    if (error) { toast({ title: "Could not add player", description: error.message, variant: "destructive" }); return; }
    await load();
    onChanged?.();
  };

  // keep dialog's group in sync after reloads
  useEffect(() => {
    if (!target) return;
    const g = groups.find((x) => x.court_id === target.court.id && x.time === target.time);
    if (g !== target.group) setTarget((t) => (t ? { ...t, group: g } : t));
  }, [groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const removePlayer = async (regId: string) => {
    const { error } = await supabase.from("event_registrations").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", regId);
    if (error) { toast({ title: "Could not remove", description: error.message, variant: "destructive" }); return; }
    refresh();
  };

  const setCoach = async (g: Group, coachId: string) => {
    const { error } = await supabase.from("events").update({ coach_id: coachId }).eq("id", g.id);
    if (error) { toast({ title: "Could not change coach", description: error.message, variant: "destructive" }); return; }
    refresh();
  };

  const deleteGroup = async (g: Group) => {
    if (!confirm("Remove this group from the court?")) return;
    await supabase.from("events").update({ status: "cancelled" }).eq("id", g.id);
    refresh();
  };

  const movePlayer = async (regId: string, fromGroup: string, court: Court, time: string) => {
    const dest = groups.find((g) => g.court_id === court.id && g.time === time);
    if (dest?.id === fromGroup) return;
    if (dest && dest.players.length >= SLOTS) { toast({ title: "That court is full (4 players)" }); return; }
    const src = groups.find((g) => g.id === fromGroup);
    const spot = src?.players.find((p) => p.reg_id === regId);
    if (!spot) return;
    if (dest?.players.some((p) => p.player_id === spot.player_id)) return;
    const id = await ensureGroup(court, time);
    if (!id) return;
    const { error } = await supabase.from("event_registrations").insert({ event_id: id, player_id: spot.player_id, status: "registered", payment_status: "pending" });
    if (error) { toast({ title: "Could not move player", description: error.message, variant: "destructive" }); return; }
    await supabase.from("event_registrations").delete().eq("id", regId);
    refresh();
  };

  if (!courts.length) return <p className="p-6 text-sm text-muted-foreground">No courts set up for this club yet.</p>;
  if (loading && !groups.length) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>;

  const placed = new Set(groups.flatMap((g) => g.players.map((p) => p.player_id)));
  const list = players.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit" style={{ display: "grid", gridTemplateColumns: `72px repeat(${courts.length}, minmax(170px, 1fr))` }}>
        <div className="sticky left-0 z-10 bg-card border-b border-border" />
        {courts.map((c) => (
          <div key={c.id} className="px-2 py-3 text-center border-b border-l border-border font-display text-[11px] tracking-wider uppercase text-muted-foreground">{c.court_number}</div>
        ))}

        {times.map((time) => (
          <div key={time} className="contents">
            <div className="sticky left-0 z-10 bg-card border-b border-border flex flex-col items-center justify-center py-2">
              <span className="font-display text-sm text-foreground">{time}</span>
              <span className="font-body text-[10px] text-muted-foreground">{addMin(time, DURATION)}</span>
            </div>
            {courts.map((court) => {
              const g = groups.find((x) => x.court_id === court.id && x.time === time);
              const color = g ? coaches.find((c) => c.id === g.coach_id)?.color || "hsl(var(--primary))" : undefined;
              return (
                <div key={court.id} className="border-b border-l border-border p-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const [regId, from] = e.dataTransfer.getData("text/plain").split("|");
                    if (regId && from) movePlayer(regId, from, court, time);
                  }}>
                  {/* Court visual: net in the middle, 2 players per side */}
                  <div className="court-surface relative rounded-md border-2 overflow-hidden"
                    style={{ borderColor: color ? `color-mix(in hsl, ${color} 70%, transparent)` : "hsl(var(--border))" }}>
                    <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
                    <div className="absolute inset-x-2 top-1/2 h-px bg-foreground/15" />
                    <div className="relative grid grid-cols-2 grid-rows-2 gap-1 p-1.5 min-h-[92px]">
                      {Array.from({ length: SLOTS }).map((_, i) => {
                        const p = g?.players[i];
                        return p ? (
                          <div key={i} draggable
                            onDragStart={(e) => { e.dataTransfer.setData("text/plain", `${p.reg_id}|${g!.id}`); }}
                            className="group/spot flex items-center gap-1 rounded bg-card/90 px-1.5 py-1 text-[10px] font-body text-foreground cursor-grab border border-border">
                            <span className="truncate flex-1">{p.name.split(" ")[0]}</span>
                            <button aria-label={`Remove ${p.name}`} onClick={() => removePlayer(p.reg_id)} className="opacity-60 hover:opacity-100 hover:text-destructive"><X size={10} /></button>
                          </div>
                        ) : (
                          <button key={i} onClick={() => { setSearch(""); setTarget({ court, time, group: g }); }}
                            aria-label={`Add player to ${court.court_number} at ${time}`}
                            className="grid place-items-center rounded border border-dashed border-foreground/25 text-muted-foreground hover:text-primary hover:border-primary">
                            <Plus size={12} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {g && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <select value={g.coach_id} onChange={(e) => setCoach(g, e.target.value)} aria-label="Coach"
                        className="min-w-0 flex-1 bg-transparent text-[10px] font-body text-foreground outline-none">
                        {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <span className="text-[10px] font-display text-muted-foreground">{g.players.length}/4</span>
                      <button aria-label="Remove group" onClick={() => deleteGroup(g)} className="text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-wider uppercase">
              {target ? `${target.court.court_number} · ${target.time}–${addMin(target.time, DURATION)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {target?.group && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users size={12} />{target.group.players.length}/4 · {coachName(target.group.coach_id)}</p>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players" className="pl-9" autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
            {list.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">No players found.</p>}
            {list.map((p) => {
              const inThis = target?.group?.players.some((x) => x.player_id === p.player_id);
              return (
                <button key={p.player_id} disabled={busy || inThis} onClick={() => addPlayer(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-secondary disabled:opacity-50">
                  <span className="text-sm text-foreground">{p.full_name}</span>
                  <span className="text-[10px] font-display tracking-wider text-muted-foreground">
                    {inThis ? "ADDED" : placed.has(p.player_id) ? "ON ANOTHER COURT" : p.level != null ? `LVL ${p.level}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubCourtBoard;
