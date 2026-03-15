import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, Plus, Users, Edit, X, Eye, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import CreateEventDrawer from "@/components/portal/CreateEventDrawer";
import { Progress } from "@/components/ui/progress";

interface EventRow {
  id: string; coach_id: string; title: string; description: string | null;
  event_type: string; sport: string; start_datetime: string; end_datetime: string;
  location_name: string | null; location_address: string | null;
  location_city: string | null; location_country: string | null;
  is_online: boolean; max_participants: number | null; current_participants: number;
  price_per_person: number; currency: string; age_group: string; skill_level: string;
  cover_image_url: string | null; status: string; created_at: string;
}

interface Registration {
  id: string; player_id: string; status: string; payment_status: string;
  amount_paid: number; registered_at: string;
  player_name?: string; player_avatar?: string | null;
}

const currencySymbol = (c: string) => ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);
const formatEventType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

const EVENT_TYPE_COLORS: Record<string, string> = {
  clinic: "bg-blue-500/20 text-blue-400",
  camp: "bg-emerald-500/20 text-emerald-400",
  group_session: "bg-violet-500/20 text-violet-400",
  masterclass: "bg-amber-500/20 text-amber-400",
  tournament: "bg-red-500/20 text-red-400",
  webinar: "bg-gray-500/20 text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-500/20 text-emerald-400",
  draft: "bg-muted text-muted-foreground",
  full: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-red-500/20 text-red-400",
  completed: "bg-blue-500/20 text-blue-400",
};

const CoachEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "drafts">("upcoming");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({});

  useEffect(() => { if (user) fetchEvents(); }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("events").select("*").eq("coach_id", user.id).order("start_datetime", { ascending: false });
    setEvents((data as any as EventRow[]) || []);
    setLoading(false);
  };

  const fetchRegistrations = async (eventId: string) => {
    if (registrations[eventId]) {
      setExpandedId(expandedId === eventId ? null : eventId);
      return;
    }
    const { data } = await supabase.from("event_registrations").select("*").eq("event_id", eventId);
    if (data && data.length > 0) {
      const playerIds = [...new Set((data as any[]).map((r: any) => r.player_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", playerIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setRegistrations(prev => ({
        ...prev,
        [eventId]: (data as any[]).map((r: any) => ({
          ...r,
          player_name: (profileMap.get(r.player_id) as any)?.full_name || "Player",
          player_avatar: (profileMap.get(r.player_id) as any)?.avatar_url,
        })),
      }));
    } else {
      setRegistrations(prev => ({ ...prev, [eventId]: [] }));
    }
    setExpandedId(eventId);
  };

  const cancelEvent = async (event: EventRow) => {
    await supabase.from("events").update({ status: "cancelled" } as any).eq("id", event.id);
    toast.success("Event cancelled");
    fetchEvents();
  };

  const completeEvent = async (event: EventRow) => {
    await supabase.from("events").update({ status: "completed" } as any).eq("id", event.id);
    toast.success("Event marked as completed");
    fetchEvents();
  };

  const now = new Date().toISOString();
  const filteredEvents = events.filter(e => {
    if (tab === "upcoming") return e.start_datetime >= now && e.status !== "draft";
    if (tab === "past") return e.start_datetime < now || e.status === "completed" || e.status === "cancelled";
    return e.status === "draft";
  });

  return (
    <PortalLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-wider text-foreground">MY EVENTS</h1>
          <button
            onClick={() => { setEditingEvent(null); setDrawerOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> CREATE EVENT
          </button>
        </div>

        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {(["upcoming", "past", "drafts"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl h-32 animate-pulse" />)}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-body text-sm text-muted-foreground">No {tab} events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const revenue = event.current_participants * Number(event.price_per_person);
              const pct = event.max_participants ? (event.current_participants / event.max_participants) * 100 : 0;
              const regs = registrations[event.id] || [];

              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-display text-base tracking-wider text-foreground">{event.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.clinic}`}>
                          {formatEventType(event.event_type).toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-display tracking-wider text-muted-foreground">{event.sport.toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${STATUS_COLORS[event.status] || STATUS_COLORS.draft}`}>{event.status.toUpperCase()}</span>
                      </div>
                      <p className="font-body text-xs text-muted-foreground">
                        {format(new Date(event.start_datetime), "EEE, d MMM yyyy · HH:mm")} – {format(new Date(event.end_datetime), "HH:mm")}
                        {event.location_city && ` · ${event.location_city}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs font-body text-muted-foreground mb-1">
                        <span>{event.current_participants} / {event.max_participants || "∞"} registered</span>
                        <span className="font-display text-primary">{currencySymbol(event.currency)}{revenue} collected</span>
                      </div>
                      {event.max_participants && <Progress value={pct} className="h-1.5" />}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setEditingEvent(event); setDrawerOpen(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[10px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                      <Edit size={12} /> EDIT
                    </button>
                    <button onClick={() => fetchRegistrations(event.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[10px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                      <Users size={12} /> REGISTRATIONS {expandedId === event.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    {event.status === "published" && (
                      <button onClick={() => cancelEvent(event)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-[10px] font-display tracking-wider text-destructive hover:bg-destructive/10 transition-colors">
                        <X size={12} /> CANCEL
                      </button>
                    )}
                    {event.status !== "completed" && event.status !== "cancelled" && (
                      <button onClick={() => completeEvent(event)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-[10px] font-display tracking-wider text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                        <CheckCircle size={12} /> COMPLETE
                      </button>
                    )}
                  </div>

                  {expandedId === event.id && (
                    <div className="border-t border-border pt-3">
                      {regs.length === 0 ? (
                        <p className="font-body text-xs text-muted-foreground text-center py-2">No registrations yet</p>
                      ) : (
                        <div className="space-y-2">
                          {regs.map(r => (
                            <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                              {r.player_avatar ? (
                                <img src={r.player_avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-[10px] font-display text-primary">{r.player_name?.charAt(0)}</span>
                                </div>
                              )}
                              <span className="font-body text-xs text-foreground flex-1">{r.player_name}</span>
                              <span className="text-[10px] font-body text-muted-foreground">{format(new Date(r.registered_at), "d MMM HH:mm")}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-display tracking-wider ${r.payment_status === "paid" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                {r.payment_status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CreateEventDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingEvent(null); }}
        event={editingEvent}
        onSaved={() => { fetchEvents(); setDrawerOpen(false); setEditingEvent(null); }}
      />
    </PortalLayout>
  );
};

export default CoachEvents;
