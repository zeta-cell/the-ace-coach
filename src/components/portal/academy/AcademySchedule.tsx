import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, Plus, Users, MapPin, Loader2, X, CheckCircle } from "lucide-react";
import CreateEventDrawer from "@/components/portal/CreateEventDrawer";
import type { AcademyCoach } from "@/hooks/useAcademy";

interface EventRow {
  id: string;
  coach_id: string;
  title: string;
  event_type: string;
  sport: string;
  start_datetime: string;
  end_datetime: string;
  location_name: string | null;
  location_city: string | null;
  max_participants: number | null;
  current_participants: number;
  price_per_person: number;
  currency: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-500/20 text-emerald-400",
  draft: "bg-muted text-muted-foreground",
  full: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-red-500/20 text-red-400",
  completed: "bg-blue-500/20 text-blue-400",
};

interface Props {
  coaches: AcademyCoach[];
  selfId: string;
  selfName: string;
}

const AcademySchedule = ({ coaches, selfId, selfName }: Props) => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "drafts">("upcoming");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const coachIds = Array.from(new Set([selfId, ...coaches.map((c) => c.coach_id)]));
  const nameOf = (id: string) =>
    id === selfId ? selfName : coaches.find((c) => c.coach_id === id)?.full_name || "Coach";

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select(
        "id, coach_id, title, event_type, sport, start_datetime, end_datetime, location_name, location_city, max_participants, current_participants, price_per_person, currency, status",
      )
      .in("coach_id", coachIds)
      .order("start_datetime", { ascending: true });
    setEvents((data || []) as EventRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachIds.join(",")]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      load();
    }
  };

  const now = new Date().toISOString();
  const filtered = events
    .filter((e) => (coachFilter === "all" ? true : e.coach_id === coachFilter))
    .filter((e) => {
      if (tab === "drafts") return e.status === "draft";
      if (tab === "upcoming") return e.start_datetime >= now && e.status !== "draft";
      return e.start_datetime < now || e.status === "completed" || e.status === "cancelled";
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(["upcoming", "past", "drafts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-md font-display text-[10px] tracking-wider ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider"
        >
          <Plus size={14} /> NEW TRAINING / CAMP
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {[{ id: "all", name: "All coaches" }, { id: selfId, name: `${selfName} (you)` }, ...coaches.filter((c) => c.coach_id !== selfId).map((c) => ({ id: c.coach_id, name: c.full_name }))].map((o) => (
          <button
            key={o.id}
            onClick={() => setCoachFilter(o.id)}
            className={`px-3 py-1.5 rounded-full font-display text-[10px] tracking-wider whitespace-nowrap border ${
              coachFilter === o.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {o.name.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground font-body text-sm">Nothing scheduled here yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm tracking-wider text-foreground truncate">{e.title}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {nameOf(e.coach_id)} · {e.event_type.replace(/_/g, " ")} · {e.sport}
                  </p>
                </div>
                <span className={`font-display text-[10px] tracking-wider px-2 py-1 rounded-full shrink-0 ${STATUS_COLORS[e.status] || "bg-secondary text-muted-foreground"}`}>
                  {e.status.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 font-body text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} /> {format(new Date(e.start_datetime), "dd MMM yyyy, HH:mm")}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} /> {e.location_name || e.location_city || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={12} /> {e.current_participants}
                  {e.max_participants ? `/${e.max_participants}` : ""}
                </span>
              </div>
              {e.status !== "cancelled" && e.status !== "completed" && (
                <div className="flex gap-3 pt-1">
                  {e.status === "draft" && (
                    <button onClick={() => setStatus(e.id, "published")} className="font-display text-[10px] tracking-wider text-primary">
                      PUBLISH
                    </button>
                  )}
                  <button onClick={() => setStatus(e.id, "completed")} className="flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground">
                    <CheckCircle size={12} /> COMPLETE
                  </button>
                  <button onClick={() => setStatus(e.id, "cancelled")} className="flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground hover:text-destructive">
                    <X size={12} /> CANCEL
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateEventDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={null}
        onSaved={() => {
          setDrawerOpen(false);
          load();
        }}
      />
    </div>
  );
};

export default AcademySchedule;
