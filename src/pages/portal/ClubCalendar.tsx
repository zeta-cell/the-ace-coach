import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, MapPin, Users, CalendarDays, LayoutGrid, X, Clock, User, Wallet, FileText } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addDays, addMonths, isSameDay, isSameMonth, isToday,
} from "date-fns";

interface ClubBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  court_number: string | null;
  court_id: string | null;
  coach_id: string;
  player_id: string;
  total_price?: number | null;
  currency?: string | null;
  notes?: string | null;
  coach_name?: string;
  player_name?: string;
}
interface Court { id: string; court_number: string }
interface Coach { id: string; name: string; color: string }

type ViewMode = "day" | "week" | "month";
type DayTab = "sessions" | "courts";

const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_H = 28; // px per 30 min
const SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR * 60 + i * 30);

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
const ds = (d: Date) => format(d, "yyyy-MM-dd");
const coachColor = (i: number) => `hsl(var(--coach-${(i % 6) + 1}))`;

const ClubCalendar = () => {
  const { activeClub, activeClubId } = useClub();
  const [bookings, setBookings] = useState<ClubBooking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("week");
  const [dayTab, setDayTab] = useState<DayTab>("sessions");
  const [cursor, setCursor] = useState(new Date());
  const [coachFilter, setCoachFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { from: cursor, to: cursor };
    if (view === "week") return { from: startOfWeek(cursor, { weekStartsOn: 1 }), to: endOfWeek(cursor, { weekStartsOn: 1 }) };
    return { from: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), to: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) };
  }, [view, cursor]);

  const load = useCallback(async () => {
    if (!activeClubId) return;
    setLoading(true);
    const [{ data }, { data: courtRows }, { data: coachRows }] = await Promise.all([
      supabase.from("bookings")
        .select("id, booking_date, start_time, end_time, status, court_number, court_id, coach_id, player_id, total_price, currency, notes")
        .eq("club_id", activeClubId)
        .gte("booking_date", ds(range.from)).lte("booking_date", ds(range.to))
        .neq("status", "cancelled")
        .order("start_time"),
      supabase.from("club_courts").select("id, court_number").eq("club_id", activeClubId).eq("is_active", true).order("court_number"),
      supabase.from("club_coaches").select("coach_id").eq("club_id", activeClubId),
    ]);
    const rows = (data || []) as ClubBooking[];
    const coachIds = Array.from(new Set([...(coachRows || []).map((c) => c.coach_id), ...rows.map((b) => b.coach_id)]));
    const ids = Array.from(new Set([...coachIds, ...rows.map((b) => b.player_id)]));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] as { user_id: string; full_name: string }[] };
    const nameOf = (id: string) => profiles?.find((p) => p.user_id === id)?.full_name;
    setCoaches(coachIds.map((id) => ({ id, name: nameOf(id) || "Coach", color: "" }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c, i) => ({ ...c, color: coachColor(i) })));
    setCourts((courtRows || []) as Court[]);
    setBookings(rows.map((b) => ({ ...b, coach_name: nameOf(b.coach_id), player_name: nameOf(b.player_id) })));
    setLoading(false);
  }, [activeClubId, range]);

  useEffect(() => { load(); }, [load]);

  const colorOf = (coachId: string) => coaches.find((c) => c.id === coachId)?.color || "hsl(var(--primary))";
  const visible = bookings.filter((b) => coachFilter === "all" || b.coach_id === coachFilter);
  const selected = bookings.find((b) => b.id === selectedId) || null;

  const move = async (id: string, date: string, startMin: number, courtId?: string) => {
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    const dur = toMin(b.end_time) - toMin(b.start_time);
    const patch: Partial<ClubBooking> = { booking_date: date, start_time: toTime(startMin), end_time: toTime(startMin + dur) };
    if (courtId) {
      patch.court_id = courtId;
      patch.court_number = courts.find((c) => c.id === courtId)?.court_number ?? b.court_number;
    }
    const prev = bookings;
    setBookings((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) {
      setBookings(prev);
      toast({ title: "Could not move session", description: error.message.includes("conflict") ? "That court is already booked at this time." : error.message, variant: "destructive" });
    } else {
      toast({ title: "Session moved", description: `${format(new Date(date), "EEE d MMM")} · ${toTime(startMin).slice(0, 5)}` });
    }
  };

  const step = (dir: 1 | -1) => {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, 7 * dir));
    else setCursor((c) => addMonths(c, dir));
  };

  const title = view === "day" ? format(cursor, "EEEE, d MMMM")
    : view === "week" ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")}`
    : format(cursor, "MMMM yyyy");

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Coach Calendar</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">All coaches, members, courts and bookings · drag a session to move it</p>
        </div>

        {/* Coach filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCoachFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-display tracking-wider border transition-colors ${coachFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >ALL COACHES</button>
          {coaches.map((c) => {
            const active = coachFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCoachFilter(active ? "all" : c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-body border transition-colors ${active ? "border-foreground text-foreground bg-secondary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => step(-1)} aria-label="Previous" className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary"><ChevronLeft size={16} /></button>
            <button onClick={() => setCursor(new Date())} className="h-9 px-3 rounded-lg border border-border text-xs font-display tracking-wider hover:bg-secondary">TODAY</button>
            <button onClick={() => step(1)} aria-label="Next" className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary"><ChevronRight size={16} /></button>
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground ml-2">{title}</h2>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/60">
            {(["day", "week", "month"] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={`px-4 py-1.5 rounded-lg font-display text-[11px] tracking-wider transition-colors ${view === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 w-fit">
            {(["sessions", "courts"] as DayTab[]).map((t) => (
              <button key={t} onClick={() => { setDayTab(t); if (t === "courts" && view !== "day") setView("day"); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-display text-[11px] tracking-wider transition-colors ${dayTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >{t === "courts" ? <LayoutGrid size={12} /> : <CalendarDays size={12} />}{t.toUpperCase()}</button>
            ))}
          </div>
          {dayTab === "courts" && (
            <span className="text-[11px] font-body text-muted-foreground">One column per court · drag a session onto another court to move it</span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] items-start">
          <Card className="p-0 overflow-hidden min-w-0">
            {loading && bookings.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : view === "month" ? (
              <MonthGrid from={range.from} to={range.to} cursor={cursor} bookings={visible} colorOf={colorOf}
                onPick={(d) => { setCursor(d); setView("day"); }} />
            ) : view === "day" && dayTab === "courts" ? (
              <TimeGrid
                columns={courts.length ? courts.map((c) => ({ key: c.id, label: c.court_number, date: ds(cursor), courtId: c.id })) : [{ key: "none", label: "No courts set up", date: ds(cursor) }]}
                bookings={visible}
                match={(b, col) => b.booking_date === col.date && (b.court_id === col.courtId || (!b.court_id && b.court_number === col.label))}
                colorOf={colorOf} onDrop={move} selectedId={selectedId} onSelect={setSelectedId} showCourt={false}
              />
            ) : (
              <TimeGrid
                columns={(view === "day" ? [cursor] : eachDayOfInterval({ start: range.from, end: range.to })).map((d) => ({
                  key: ds(d), label: format(d, view === "day" ? "EEEE d" : "EEE d"), date: ds(d), today: isToday(d),
                }))}
                bookings={visible}
                match={(b, col) => b.booking_date === col.date}
                colorOf={colorOf} onDrop={move} selectedId={selectedId} onSelect={setSelectedId} showCourt
              />
            )}
          </Card>

          <DetailsPanel
            selected={selected}
            bookings={visible}
            courts={courts}
            coaches={coaches}
            colorOf={colorOf}
            periodLabel={title}
            onClear={() => setSelectedId(null)}
            onOpenCourts={() => { setDayTab("courts"); setView("day"); }}
            onSelect={setSelectedId}
          />
        </div>

        {!loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><CalendarDays size={16} /> No sessions in this period.</p>
        )}
      </div>
    </PortalLayout>
  );
};

interface Column { key: string; label: string; date: string; courtId?: string; today?: boolean }

const TimeGrid = ({ columns, bookings, match, colorOf, onDrop }: {
  columns: Column[];
  bookings: ClubBooking[];
  match: (b: ClubBooking, c: Column) => boolean;
  colorOf: (id: string) => string;
  onDrop: (id: string, date: string, startMin: number, courtId?: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showCourt: boolean;
}) => {
  const [over, setOver] = useState<string | null>(null);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit" style={{ display: "grid", gridTemplateColumns: `52px repeat(${columns.length}, minmax(${columns.length > 4 ? 96 : 140}px, 1fr))` }}>
        <div className="sticky left-0 z-20 bg-card border-b border-border" />
        {columns.map((c) => (
          <div key={c.key} className={`px-2 py-3 text-center border-b border-l border-border font-display text-[11px] tracking-wider uppercase truncate ${c.today ? "text-primary" : "text-muted-foreground"}`}>{c.label}</div>
        ))}

        <div className="sticky left-0 z-10 bg-card">
          {SLOTS.map((m) => (
            <div key={m} style={{ height: SLOT_H }} className="pr-2 text-right text-[10px] text-muted-foreground font-body -translate-y-1.5">
              {m % 60 === 0 ? toTime(m).slice(0, 5) : ""}
            </div>
          ))}
        </div>

        {columns.map((col) => (
          <div key={col.key} className="relative border-l border-border">
            {SLOTS.map((m) => {
              const k = `${col.key}-${m}`;
              return (
                <div key={m} style={{ height: SLOT_H }}
                  className={`${m % 60 === 0 ? "border-t border-border" : "border-t border-border/30"} ${over === k ? "bg-primary/15" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setOver(k); }}
                  onDragLeave={() => setOver((o) => (o === k ? null : o))}
                  onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) onDrop(id, col.date, m, col.courtId); }}
                />
              );
            })}
            {bookings.filter((b) => match(b, col)).map((b) => {
              const s = toMin(b.start_time), e = toMin(b.end_time);
              const top = ((s - START_HOUR * 60) / 30) * SLOT_H;
              const h = Math.max(((e - s) / 30) * SLOT_H - 3, 22);
              const color = colorOf(b.coach_id);
              const isSel = selectedId === b.id;
              return (
                <div key={b.id} draggable role="button" tabIndex={0}
                  onClick={() => onSelect(isSel ? null : b.id)}
                  onKeyDown={(ev) => { if (ev.key === "Enter") onSelect(b.id); }}
                  onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", b.id); ev.dataTransfer.effectAllowed = "move"; }}
                  className={`absolute left-1 right-1 rounded-md px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing border hover:brightness-110 ${isSel ? "border-primary ring-2 ring-primary/60 z-10" : "border-border"}`}
                  style={{ top: top + 1, height: h, borderLeft: `3px solid ${color}`, background: `color-mix(in hsl, ${color} 18%, hsl(var(--card)))` }}
                  title={`${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)} · ${b.coach_name} with ${b.player_name}${b.court_number ? ` · ${b.court_number}` : ""}`}
                >
                  <div className="text-[11px] font-display tracking-wide text-foreground truncate">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</div>
                  <div className="text-[11px] font-body text-foreground truncate">{b.coach_name || "Coach"}</div>
                  {h > 50 && <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1"><Users size={10} className="shrink-0" />{b.player_name || "Member"}</div>}
                  {showCourt && b.court_number && (
                    <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded bg-background/60 px-1.5 py-px text-[10px] text-foreground truncate">
                      <MapPin size={9} className="shrink-0 text-primary" />{b.court_number}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const minsOf = (b: ClubBooking) => toMin(b.end_time) - toMin(b.start_time);
const hrs = (m: number) => `${Math.round((m / 60) * 10) / 10}h`;

const DetailsPanel = ({ selected, bookings, courts, coaches, colorOf, periodLabel, onClear, onOpenCourts, onSelect }: {
  selected: ClubBooking | null;
  bookings: ClubBooking[];
  courts: Court[];
  coaches: Coach[];
  colorOf: (id: string) => string;
  periodLabel: string;
  onClear: () => void;
  onOpenCourts: () => void;
  onSelect: (id: string) => void;
}) => {
  if (selected) {
    const color = colorOf(selected.coach_id);
    const rows: { icon: typeof Clock; label: string; value: string }[] = [
      { icon: CalendarDays, label: "Date", value: format(new Date(selected.booking_date + "T00:00"), "EEEE, d MMMM") },
      { icon: Clock, label: "Time", value: `${selected.start_time.slice(0, 5)} – ${selected.end_time.slice(0, 5)} (${minsOf(selected)} min)` },
      { icon: User, label: "Coach", value: selected.coach_name || "Coach" },
      { icon: Users, label: "Member", value: selected.player_name || "Member" },
      { icon: MapPin, label: "Court", value: selected.court_number || "Not assigned" },
      { icon: Wallet, label: "Price", value: selected.total_price != null ? `${Number(selected.total_price).toFixed(2)} ${selected.currency || "EUR"}` : "—" },
    ];
    return (
      <Card className="p-4 md:sticky md:top-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Session details</p>
            <p className="font-display text-base text-foreground mt-1">{selected.start_time.slice(0, 5)}–{selected.end_time.slice(0, 5)}</p>
          </div>
          <button onClick={onClear} aria-label="Close details" className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground"><X size={14} /></button>
        </div>
        <div className="h-1 rounded-full" style={{ background: color }} />
        <dl className="space-y-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={14} className="mt-0.5 text-primary shrink-0" />
              <div className="min-w-0">
                <dt className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">{label}</dt>
                <dd className="text-sm font-body text-foreground break-words">{value}</dd>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full shrink-0 bg-primary" />
            <div>
              <dt className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Status</dt>
              <dd className="text-sm font-body text-foreground capitalize">{selected.status}</dd>
            </div>
          </div>
          {selected.notes && (
            <div className="flex items-start gap-3">
              <FileText size={14} className="mt-0.5 text-primary shrink-0" />
              <div className="min-w-0">
                <dt className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Notes</dt>
                <dd className="text-sm font-body text-foreground break-words">{selected.notes}</dd>
              </div>
            </div>
          )}
        </dl>
        <p className="text-[11px] text-muted-foreground font-body">Drag the session in the calendar to move it to another time or court.</p>
      </Card>
    );
  }

  const totalMin = bookings.reduce((s, b) => s + minsOf(b), 0);
  const revenue = bookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
  const courtUse = courts.map((c) => {
    const list = bookings.filter((b) => b.court_id === c.id || (!b.court_id && b.court_number === c.court_number));
    return { ...c, count: list.length, mins: list.reduce((s, b) => s + minsOf(b), 0) };
  });
  const maxCourt = Math.max(1, ...courtUse.map((c) => c.mins));
  const coachUse = coaches.map((c) => {
    const list = bookings.filter((b) => b.coach_id === c.id);
    return { ...c, count: list.length, mins: list.reduce((s, b) => s + minsOf(b), 0) };
  }).filter((c) => c.count > 0);
  const upcoming = [...bookings].sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time)).slice(0, 5);

  return (
    <Card className="p-4 md:sticky md:top-4 space-y-5">
      <div>
        <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Overview</p>
        <p className="font-display text-sm text-foreground mt-1">{periodLabel}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[{ k: "Sessions", v: String(bookings.length) }, { k: "Hours", v: hrs(totalMin) }, { k: "Revenue", v: `€${Math.round(revenue)}` }].map((s) => (
          <div key={s.k} className="rounded-lg bg-secondary/60 p-2">
            <p className="font-display text-base text-foreground">{s.v}</p>
            <p className="text-[9px] font-display tracking-wider uppercase text-muted-foreground">{s.k}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground">Courts</p>
          <button onClick={onOpenCourts} className="text-[10px] font-display tracking-wider text-primary hover:underline">COURT VIEW</button>
        </div>
        {courtUse.length === 0 ? (
          <p className="text-xs text-muted-foreground">No courts set up yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {courtUse.map((c) => (
              <li key={c.id} className="text-xs font-body">
                <div className="flex justify-between text-foreground"><span className="truncate">{c.court_number}</span><span className="text-muted-foreground">{c.count ? `${c.count} · ${hrs(c.mins)}` : "free"}</span></div>
                <div className="h-1 mt-1 rounded-full bg-secondary overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c.mins / maxCourt) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {coachUse.length > 0 && (
        <div>
          <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-2">Coaches</p>
          <ul className="space-y-1.5">
            {coachUse.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-xs font-body text-foreground">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="truncate flex-1">{c.name}</span>
                <span className="text-muted-foreground">{c.count} · {hrs(c.mins)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] font-display tracking-wider uppercase text-muted-foreground mb-2">Sessions</p>
          <ul className="space-y-1">
            {upcoming.map((b) => (
              <li key={b.id}>
                <button onClick={() => onSelect(b.id)} className="w-full text-left rounded-md px-2 py-1.5 hover:bg-secondary text-xs font-body flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: colorOf(b.coach_id) }} />
                  <span className="text-muted-foreground shrink-0">{format(new Date(b.booking_date + "T00:00"), "EEE")} {b.start_time.slice(0, 5)}</span>
                  <span className="truncate text-foreground">{b.player_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground font-body">Click a session to see its details here.</p>
    </Card>
  );
};

const MonthGrid = ({ from, to, cursor, bookings, colorOf, onPick }: {
  from: Date; to: Date; cursor: Date; bookings: ClubBooking[];
  colorOf: (id: string) => string; onPick: (d: Date) => void;
}) => {
  const days = eachDayOfInterval({ start: from, end: to });
  return (
    <div className="grid grid-cols-7">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div key={d} className="py-2 text-center font-display text-[11px] tracking-wider uppercase text-muted-foreground border-b border-border">{d}</div>
      ))}
      {days.map((d) => {
        const list = bookings.filter((b) => isSameDay(new Date(b.booking_date + "T00:00"), d));
        return (
          <button key={d.toISOString()} onClick={() => onPick(d)}
            className={`min-h-[96px] p-2 text-left border-b border-l border-border hover:bg-secondary/50 transition-colors ${isSameMonth(d, cursor) ? "" : "opacity-40"}`}
          >
            <div className={`text-xs font-display mb-1 ${isToday(d) ? "text-primary" : "text-foreground"}`}>{format(d, "d")}</div>
            <div className="space-y-0.5">
              {list.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center gap-1 text-[10px] text-foreground truncate">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: colorOf(b.coach_id) }} />
                  {b.start_time.slice(0, 5)} {b.coach_name?.split(" ")[0]}
                </div>
              ))}
              {list.length > 3 && <div className="text-[10px] text-muted-foreground">+{list.length - 3} more</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ClubCalendar;
