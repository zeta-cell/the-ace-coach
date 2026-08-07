import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PublicHeader from "@/components/PublicHeader";
import PublicBottomNav from "@/components/PublicBottomNav";
import ClassAttendees from "@/components/class/ClassAttendees";
import ClassChat from "@/components/class/ClassChat";
import RateCoachDialog from "@/components/class/RateCoachDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar, MapPin, Users, Target, Clock, ShieldCheck, Globe, Loader2,
  CheckCircle2, Star, Backpack, Pencil, ArrowLeft, Sun, Info,
} from "lucide-react";

interface ClassRow {
  id: string; coach_id: string; title: string; description: string | null;
  event_type: string; sport: string; start_datetime: string; end_datetime: string;
  location_name: string | null; location_address: string | null;
  location_city: string | null; location_country: string | null;
  is_online: boolean; max_participants: number | null; min_participants: number;
  current_participants: number; price_per_person: number; currency: string;
  age_group: string; skill_level: string; level_min: number | null; level_max: number | null;
  goals: string | null; what_to_bring: string | null;
  cancellation_hours: number; cancellation_policy: string | null;
  registration_deadline: string | null; attendees_visible: boolean;
  media_urls: string[]; video_urls: string[]; cover_image_url: string | null;
  court_number: string | null; arrival_instructions: string | null; status: string;
}

const currencySymbol = (c: string) => ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
const lvl = (v: number | null) => (v == null ? "—" : String(v).replace(/\.?0+$/, ""));

const youtubeId = (url: string) => {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
};

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [coach, setCoach] = useState<{ full_name: string; avatar_url: string | null; slug: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [rateOpen, setRateOpen] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  const canManage = !!user && !!cls && user.id === cls.coach_id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (!data) { setLoading(false); return; }
      setCls(data as unknown as ClassRow);

      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", data.coach_id).maybeSingle(),
        supabase.from("coach_profiles").select("profile_slug").eq("user_id", data.coach_id).maybeSingle(),
      ]);
      setCoach({ full_name: p?.full_name || "Coach", avatar_url: p?.avatar_url || null, slug: cp?.profile_slug || data.coach_id });
      setLoading(false);
    })();
  }, [id, refresh]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", id)
      .eq("player_id", user.id)
      .maybeSingle()
      .then(({ data }) => setRegistered(!!data && data.status !== "cancelled"));
  }, [user, id, refresh]);

  // Weather for outdoor sessions within the next 14 days
  useEffect(() => {
    if (!cls || cls.is_online || !cls.location_city) return;
    (async () => {
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cls.location_city!)}&count=1`).then((r) => r.json());
        const place = geo?.results?.[0];
        if (!place) return;
        const day = cls.start_datetime.slice(0, 10);
        const fc = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=temperature_2m_max,weather_code&start_date=${day}&end_date=${day}&timezone=auto`,
        ).then((r) => r.json());
        if (fc?.daily?.temperature_2m_max?.[0] != null) {
          setWeather({ temp: Math.round(fc.daily.temperature_2m_max[0]), code: fc.daily.weather_code?.[0] ?? 0 });
        }
      } catch { /* forecast is a nice-to-have */ }
    })();
  }, [cls]);

  const register = async () => {
    if (!user) { navigate(`/login?redirect=/class/${id}`); return; }
    if (!cls) return;
    setBusy(true);
    const isFree = Number(cls.price_per_person) === 0;
    const { error } = await supabase.from("event_registrations").insert({
      event_id: cls.id,
      player_id: user.id,
      status: "registered",
      payment_status: isFree ? "paid" : "pending",
      amount_paid: isFree ? 0 : Number(cls.price_per_person),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("You're in — see you on court");
    setRegistered(true);
    setRefresh((r) => r + 1);
  };

  const cancel = async () => {
    if (!user || !cls) return;
    const deadline = new Date(cls.start_datetime).getTime() - cls.cancellation_hours * 3600_000;
    if (Date.now() > deadline && cls.cancellation_hours > 0) {
      if (!confirm("You're past the free cancellation window — the spot may still be charged. Cancel anyway?")) return;
    }
    setBusy(true);
    await supabase
      .from("event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("event_id", cls.id)
      .eq("player_id", user.id);
    setBusy(false);
    setRegistered(false);
    toast.success("Registration cancelled");
    setRefresh((r) => r + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="px-4 py-24 text-center">
          <p className="font-display text-lg text-foreground">Class not found</p>
          <Link to="/events" className="mt-3 inline-block font-display text-[11px] tracking-wider text-primary">BACK TO CLASSES</Link>
        </div>
      </div>
    );
  }

  const isFree = Number(cls.price_per_person) === 0;
  const spots = cls.max_participants ? cls.max_participants - cls.current_participants : null;
  const goalLines = (cls.goals || "").split("\n").map((g) => g.trim()).filter(Boolean);
  const past = new Date(cls.end_datetime) < new Date();

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <PublicHeader />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        {cls.cover_image_url ? (
          <img src={cls.cover_image_url} alt={cls.title} className="h-56 w-full object-cover md:h-72" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent md:h-52" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-5">
          <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1.5 font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> BACK
          </button>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-primary">{label(cls.event_type).toUpperCase()}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">{cls.sport.toUpperCase()}</span>
            {cls.is_online && (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 font-display text-[10px] tracking-wider text-sky-400">
                <Globe size={10} /> ONLINE
              </span>
            )}
            {(cls.level_min != null || cls.level_max != null) && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">
                LEVEL {lvl(cls.level_min)}–{lvl(cls.level_max)}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl tracking-wider text-foreground md:text-4xl">{cls.title}</h1>
          {coach && (
            <Link to={`/coach/${coach.slug}`} className="mt-2 inline-flex items-center gap-2">
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 font-display text-[10px] text-primary">{coach.full_name.charAt(0)}</span>
              )}
              <span className="font-body text-sm text-muted-foreground">with {coach.full_name}</span>
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-4 px-4 py-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* Key facts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-border bg-card/60 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 font-display text-[10px] tracking-wider text-muted-foreground"><Calendar size={11} /> WHEN</p>
              <p className="font-body text-sm text-foreground">{format(new Date(cls.start_datetime), "EEE d MMM, HH:mm")}</p>
              <p className="font-body text-[11px] text-muted-foreground">until {format(new Date(cls.end_datetime), "HH:mm")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 font-display text-[10px] tracking-wider text-muted-foreground"><MapPin size={11} /> WHERE</p>
              <p className="font-body text-sm text-foreground">{cls.is_online ? "Online" : cls.location_name || cls.location_city || "TBA"}</p>
              <p className="font-body text-[11px] text-muted-foreground">
                {cls.is_online ? "Link shared in the group chat" : [cls.location_city, cls.court_number].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 font-display text-[10px] tracking-wider text-muted-foreground"><Users size={11} /> GROUP</p>
              <p className="font-body text-sm text-foreground">
                {cls.current_participants}{cls.max_participants ? `/${cls.max_participants}` : ""} players
              </p>
              <p className="font-body text-[11px] text-muted-foreground">Starts from {cls.min_participants}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card/60 p-3.5">
              <p className="mb-1 flex items-center gap-1.5 font-display text-[10px] tracking-wider text-muted-foreground"><ShieldCheck size={11} /> CANCELLATION</p>
              <p className="font-body text-sm text-foreground">
                {cls.cancellation_hours === 0 ? "Non-refundable" : `Free until ${cls.cancellation_hours}h before`}
              </p>
              {cls.registration_deadline && (
                <p className="font-body text-[11px] text-muted-foreground">Sign-up closes {format(new Date(cls.registration_deadline), "d MMM, HH:mm")}</p>
              )}
            </div>
          </div>

          {weather && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/60 px-4 py-3">
              <Sun size={15} className="text-amber-500" />
              <p className="font-body text-sm text-foreground">{weather.temp}°C expected in {cls.location_city} on the day</p>
            </div>
          )}

          {cls.description && (
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="mb-1.5 font-display text-[11px] tracking-wider text-foreground">ABOUT THIS SESSION</p>
              <p className="whitespace-pre-wrap font-body text-sm text-muted-foreground">{cls.description}</p>
            </div>
          )}

          {goalLines.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-display text-[11px] tracking-wider text-foreground"><Target size={12} className="text-primary" /> GOALS</p>
              <ul className="space-y-1.5">
                {goalLines.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" /> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(cls.what_to_bring || cls.arrival_instructions || cls.cancellation_policy) && (
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              {cls.what_to_bring && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-display text-[11px] tracking-wider text-foreground"><Backpack size={12} className="text-primary" /> WHAT TO BRING</p>
                  <p className="whitespace-pre-wrap font-body text-sm text-muted-foreground">{cls.what_to_bring}</p>
                </div>
              )}
              {cls.arrival_instructions && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-display text-[11px] tracking-wider text-foreground"><Info size={12} className="text-primary" /> ARRIVAL</p>
                  <p className="whitespace-pre-wrap font-body text-sm text-muted-foreground">{cls.arrival_instructions}</p>
                </div>
              )}
              {cls.cancellation_policy && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-display text-[11px] tracking-wider text-foreground"><Clock size={12} className="text-primary" /> POLICY</p>
                  <p className="whitespace-pre-wrap font-body text-sm text-muted-foreground">{cls.cancellation_policy}</p>
                </div>
              )}
            </div>
          )}

          {/* Media */}
          {(cls.media_urls?.length > 0 || cls.video_urls?.length > 0) && (
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              <p className="font-display text-[11px] tracking-wider text-foreground">GALLERY</p>
              {cls.media_urls?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {cls.media_urls.map((u, i) => (
                    <img key={i} src={u} alt={`${cls.title} photo ${i + 1}`} loading="lazy" className="h-24 w-full rounded-xl object-cover" />
                  ))}
                </div>
              )}
              {cls.video_urls?.map((u, i) => {
                const yt = youtubeId(u);
                return yt ? (
                  <iframe key={i} src={`https://www.youtube.com/embed/${yt}`} title={`Video ${i + 1}`} allowFullScreen
                    className="aspect-video w-full rounded-xl border border-border" />
                ) : (
                  <video key={i} src={u} controls className="aspect-video w-full rounded-xl border border-border" />
                );
              })}
            </div>
          )}

          {(registered || canManage) && <ClassChat eventId={cls.id} canManage={canManage} canPost={registered || canManage} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="font-display text-3xl text-foreground">
              {isFree ? "Free" : `${currencySymbol(cls.currency)}${Number(cls.price_per_person)}`}
            </p>
            <p className="font-body text-[11px] text-muted-foreground">per player</p>
            {spots !== null && spots <= 3 && spots > 0 && (
              <p className="mt-2 font-display text-[10px] tracking-wider text-amber-500">ONLY {spots} SPOTS LEFT</p>
            )}
            <div className="mt-3 space-y-2">
              {canManage ? (
                <Link to="/coach/events" className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-display text-[11px] tracking-wider text-foreground">
                  <Pencil size={13} /> MANAGE THIS CLASS
                </Link>
              ) : past ? (
                <>
                  <p className="text-center font-body text-xs text-muted-foreground">This class has finished.</p>
                  {registered && (
                    <button onClick={() => setRateOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-[11px] tracking-wider text-primary-foreground">
                      <Star size={13} /> RATE YOUR COACH
                    </button>
                  )}
                </>
              ) : registered ? (
                <>
                  <span className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 py-3 font-display text-[11px] tracking-wider text-emerald-500">
                    <CheckCircle2 size={13} /> YOU'RE REGISTERED
                  </span>
                  <button onClick={cancel} disabled={busy} className="w-full font-body text-[11px] text-muted-foreground hover:text-destructive">
                    Cancel my spot
                  </button>
                </>
              ) : (
                <button onClick={register} disabled={busy || cls.status === "full"}
                  className="w-full rounded-xl bg-primary py-3.5 font-display text-[11px] tracking-wider text-primary-foreground disabled:opacity-50">
                  {busy ? "…" : cls.status === "full" ? "CLASS FULL" : "JOIN THIS CLASS"}
                </button>
              )}
            </div>
          </div>

          <ClassAttendees
            key={refresh}
            eventId={cls.id}
            canManage={canManage}
            maxParticipants={cls.max_participants}
            minParticipants={cls.min_participants}
            levelMin={cls.level_min}
            levelMax={cls.level_max}
            onChanged={() => setRefresh((r) => r + 1)}
          />
        </div>
      </div>

      {coach && (
        <RateCoachDialog
          open={rateOpen}
          onClose={() => setRateOpen(false)}
          coachId={cls.coach_id}
          coachName={coach.full_name}
          eventId={cls.id}
        />
      )}

      <PublicBottomNav />
    </div>
  );
};

export default ClassDetail;
