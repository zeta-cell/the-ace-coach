import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { differenceInMinutes } from "date-fns";
import {
  Sparkles, Calendar, MapPin, Users, Target, Image as ImageIcon,
  ShieldCheck, Loader2, Plus, X, Eye,
} from "lucide-react";

interface EventRow {
  id: string; coach_id: string; title: string; description: string | null;
  event_type: string; sport: string; start_datetime: string; end_datetime: string;
  location_name: string | null; location_address: string | null;
  location_city: string | null; location_country: string | null;
  is_online: boolean; max_participants: number | null;
  price_per_person: number; currency: string; age_group: string; skill_level: string;
  cover_image_url: string | null; status: string;
  [key: string]: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  event: EventRow | null;
  onSaved: () => void;
}

const EVENT_TYPES = ["clinic", "camp", "group_session", "masterclass", "tournament", "webinar"];
const SPORTS = ["tennis", "padel", "both"];
const AGE_GROUPS = ["all", "kids", "junior", "adult", "senior"];
const SKILL_LEVELS = ["all", "beginner", "intermediate", "advanced"];
const CURRENCIES = ["EUR", "USD", "GBP"];
const CANCEL_WINDOWS = [0, 12, 24, 48, 72];

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const Section = ({
  icon: Icon, title, hint, children,
}: { icon: typeof Calendar; title: string; hint?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-4">
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Icon size={14} />
      </span>
      <div>
        <p className="font-display text-[11px] tracking-wider text-foreground">{title}</p>
        {hint && <p className="font-body text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="block font-display text-[10px] tracking-wider text-muted-foreground">{label}</label>
    {children}
  </div>
);

const CreateEventDrawer = ({ open, onClose, event, onSaved }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("clinic");
  const [sport, setSport] = useState("both");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [minParticipants, setMinParticipants] = useState("1");
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [ageGroup, setAgeGroup] = useState("all");
  const [skillLevel, setSkillLevel] = useState("all");
  const [levelMin, setLevelMin] = useState("");
  const [levelMax, setLevelMax] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [whatToBring, setWhatToBring] = useState("");
  const [cancellationHours, setCancellationHours] = useState(24);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [attendeesVisible, setAttendeesVisible] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [mediaDraft, setMediaDraft] = useState("");
  const [videoDraft, setVideoDraft] = useState("");
  const [courtNumber, setCourtNumber] = useState("");
  const [arrivalInstructions, setArrivalInstructions] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setEventType(event.event_type);
      setSport(event.sport);
      const sd = new Date(event.start_datetime);
      const ed = new Date(event.end_datetime);
      setStartDate(sd.toISOString().slice(0, 10));
      setStartTime(sd.toISOString().slice(11, 16));
      setEndDate(ed.toISOString().slice(0, 10));
      setEndTime(ed.toISOString().slice(11, 16));
      setLocationName(event.location_name || "");
      setLocationAddress(event.location_address || "");
      setLocationCity(event.location_city || "");
      setLocationCountry(event.location_country || "");
      setIsOnline(event.is_online || false);
      setMaxParticipants(event.max_participants?.toString() || "");
      setMinParticipants(event.min_participants?.toString() || "1");
      setPrice(event.price_per_person?.toString() || "0");
      setCurrency(event.currency || "EUR");
      setAgeGroup(event.age_group || "all");
      setSkillLevel(event.skill_level || "all");
      setLevelMin(event.level_min?.toString() || "");
      setLevelMax(event.level_max?.toString() || "");
      setCoverUrl(event.cover_image_url || "");
      setDescription(event.description || "");
      setGoals(event.goals || "");
      setWhatToBring(event.what_to_bring || "");
      setCancellationHours(event.cancellation_hours ?? 24);
      setCancellationPolicy(event.cancellation_policy || "");
      setRegistrationDeadline(event.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : "");
      setAttendeesVisible(event.attendees_visible ?? true);
      setMediaUrls(event.media_urls || []);
      setVideoUrls(event.video_urls || []);
      setCourtNumber(event.court_number || "");
      setArrivalInstructions(event.arrival_instructions || "");
      setIsDraft(event.status === "draft");
    } else {
      setTitle(""); setEventType("clinic"); setSport("both");
      setStartDate(""); setStartTime(""); setEndDate(""); setEndTime("");
      setLocationName(""); setLocationAddress(""); setLocationCity(""); setLocationCountry("");
      setIsOnline(false); setMaxParticipants(""); setMinParticipants("1"); setPrice("0"); setCurrency("EUR");
      setAgeGroup("all"); setSkillLevel("all"); setLevelMin(""); setLevelMax("");
      setCoverUrl(""); setDescription(""); setGoals(""); setWhatToBring("");
      setCancellationHours(24); setCancellationPolicy(""); setRegistrationDeadline("");
      setAttendeesVisible(true); setMediaUrls([]); setVideoUrls([]);
      setMediaDraft(""); setVideoDraft("");
      setCourtNumber(""); setArrivalInstructions(""); setIsDraft(false);
    }
  }, [event, open]);

  const duration = startDate && startTime && endDate && endTime
    ? differenceInMinutes(new Date(`${endDate}T${endTime}`), new Date(`${startDate}T${startTime}`))
    : 0;
  const durationLabel = duration > 0
    ? duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ""}` : `${duration}m`
    : "";

  const revenueMin = (parseFloat(price) || 0) * (parseInt(minParticipants) || 0);
  const revenueMax = maxParticipants ? (parseFloat(price) || 0) * parseInt(maxParticipants) : null;

  const handleSave = async () => {
    if (!user || !title || !startDate || !startTime || !endDate || !endTime) {
      toast.error("Fill in title, start and end");
      return;
    }
    const min = parseInt(minParticipants) || 1;
    const max = maxParticipants ? parseInt(maxParticipants) : null;
    if (max !== null && min > max) {
      toast.error("Minimum can't be higher than the maximum");
      return;
    }
    if (levelMin && levelMax && parseFloat(levelMin) > parseFloat(levelMax)) {
      toast.error("Level range is inverted");
      return;
    }
    setSaving(true);
    const payload = {
      coach_id: event?.coach_id || user.id,
      title,
      event_type: eventType,
      sport,
      start_datetime: new Date(`${startDate}T${startTime}`).toISOString(),
      end_datetime: new Date(`${endDate}T${endTime}`).toISOString(),
      location_name: isOnline ? "Online" : locationName || null,
      location_address: isOnline ? null : locationAddress || null,
      location_city: isOnline ? "Online" : locationCity || null,
      location_country: isOnline ? null : locationCountry || null,
      is_online: isOnline,
      max_participants: max,
      min_participants: min,
      price_per_person: parseFloat(price) || 0,
      currency,
      age_group: ageGroup,
      skill_level: skillLevel,
      level_min: levelMin ? parseFloat(levelMin) : null,
      level_max: levelMax ? parseFloat(levelMax) : null,
      cover_image_url: coverUrl || null,
      description: description || null,
      goals: goals || null,
      what_to_bring: whatToBring || null,
      cancellation_hours: cancellationHours,
      cancellation_policy: cancellationPolicy || null,
      registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
      attendees_visible: attendeesVisible,
      media_urls: mediaUrls,
      video_urls: videoUrls,
      court_number: courtNumber || null,
      arrival_instructions: arrivalInstructions || null,
      status: isDraft ? "draft" : "published",
    };

    const { error } = event
      ? await supabase.from("events").update(payload).eq("id", event.id)
      : await supabase.from("events").insert(payload);

    if (error) { toast.error("Failed to save: " + error.message); setSaving(false); return; }
    toast.success(event ? "Class updated" : "Class created");
    setSaving(false);
    onSaved();
  };

  const ChipGroup = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`rounded-lg px-3 py-1.5 font-display text-[10px] tracking-wider transition-colors ${value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          {formatLabel(o).toUpperCase()}
        </button>
      ))}
    </div>
  );

  const UrlList = ({
    label, placeholder, list, setList, draft, setDraft,
  }: { label: string; placeholder: string; list: string[]; setList: (v: string[]) => void; draft: string; setDraft: (v: string) => void }) => (
    <Field label={label}>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <button
          type="button"
          onClick={() => { if (draft.trim()) { setList([...list, draft.trim()]); setDraft(""); } }}
          className="shrink-0 rounded-md bg-secondary px-3 text-muted-foreground hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>
      {list.length > 0 && (
        <div className="mt-2 space-y-1">
          {list.map((u, i) => (
            <div key={`${u}-${i}`} className="flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-1.5">
              <span className="flex-1 truncate font-body text-[11px] text-muted-foreground">{u}</span>
              <button type="button" onClick={() => setList(list.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Field>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[94vh] overflow-y-auto rounded-t-3xl border-border bg-background p-0">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="flex items-center gap-2 font-display tracking-wider">
              <Sparkles size={16} className="text-primary" />
              {event ? "EDIT CLASS" : "CREATE A CLASS"}
            </SheetTitle>
            <p className="font-body text-xs text-muted-foreground">
              Clinics, camps, group sessions, masterclasses, tournaments and online sessions — all in one place.
            </p>
          </SheetHeader>
        </div>

        <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
          <Section icon={Sparkles} title="THE BASICS" hint="What is it and for which sport?">
            <Field label="TITLE *">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Saturday Padel Clinic — Bandeja & Defence" />
            </Field>
            <Field label="TYPE">
              <ChipGroup options={EVENT_TYPES} value={eventType} onChange={setEventType} />
            </Field>
            <Field label="SPORT">
              <ChipGroup options={SPORTS} value={sport} onChange={setSport} />
            </Field>
            <Field label="DESCRIPTION">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Sell the session in two lines." />
            </Field>
          </Section>

          <Section icon={Calendar} title="WHEN" hint={durationLabel ? `Duration: ${durationLabel}` : "Start and end of the session"}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="START DATE *">
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} />
              </Field>
              <Field label="START TIME *">
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Field>
              <Field label="END DATE *">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
              <Field label="END TIME *">
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </Field>
            </div>
            <Field label="REGISTRATION CLOSES (OPTIONAL)">
              <Input type="datetime-local" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
            </Field>
          </Section>

          <Section icon={MapPin} title="WHERE" hint="Online sessions skip the address">
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
              <span className="font-display text-[10px] tracking-wider text-muted-foreground">ONLINE SESSION</span>
              <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            </div>
            {!isOnline && (
              <>
                <Field label="VENUE / CLUB">
                  <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Padel Club Marbella" />
                </Field>
                <Field label="ADDRESS">
                  <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Full address (used for maps & weather)" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CITY">
                    <Input value={locationCity} onChange={(e) => setLocationCity(e.target.value)} placeholder="City" />
                  </Field>
                  <Field label="COUNTRY">
                    <Input value={locationCountry} onChange={(e) => setLocationCountry(e.target.value)} placeholder="Country" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="COURT #">
                    <Input value={courtNumber} onChange={(e) => setCourtNumber(e.target.value)} placeholder="e.g. Court 4" />
                  </Field>
                </div>
                <Field label="ARRIVAL INSTRUCTIONS">
                  <Textarea value={arrivalInstructions} onChange={(e) => setArrivalInstructions(e.target.value)} rows={2} placeholder="Reception → Court 4. Say you're here for the clinic." />
                </Field>
              </>
            )}
          </Section>

          <Section icon={Users} title="CAPACITY & PRICE" hint="Minimum decides whether the class runs">
            <div className="grid grid-cols-2 gap-3">
              <Field label="MIN TO START">
                <Input type="number" min={1} value={minParticipants} onChange={(e) => setMinParticipants(e.target.value)} placeholder="1" />
              </Field>
              <Field label="MAX PLAYERS">
                <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Unlimited" />
              </Field>
            </div>
            <Field label="PRICE PER PERSON">
              <div className="flex gap-2">
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0 = free" className="flex-1" />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-md border border-border bg-card px-2 font-body text-xs text-foreground">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </Field>
            {(parseFloat(price) || 0) > 0 && (
              <p className="font-body text-[11px] text-muted-foreground">
                Runs from <span className="text-foreground">{currency} {revenueMin.toFixed(0)}</span>
                {revenueMax !== null && <> up to <span className="text-foreground">{currency} {revenueMax.toFixed(0)}</span></>} gross.
              </p>
            )}
          </Section>

          <Section icon={Target} title="WHO IT'S FOR" hint="Level restrictions keep the group balanced">
            <Field label="AGE GROUP">
              <ChipGroup options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
            </Field>
            <Field label="SKILL LEVEL">
              <ChipGroup options={SKILL_LEVELS} value={skillLevel} onChange={setSkillLevel} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="LEVEL FROM">
                <Input type="number" step="0.25" value={levelMin} onChange={(e) => setLevelMin(e.target.value)} placeholder="e.g. 2.5" />
              </Field>
              <Field label="LEVEL TO">
                <Input type="number" step="0.25" value={levelMax} onChange={(e) => setLevelMax(e.target.value)} placeholder="e.g. 4.0" />
              </Field>
            </div>
            <Field label="GOALS OF THE SESSION">
              <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3} placeholder="One goal per line — e.g. Consistent bandeja under pressure" />
            </Field>
            <Field label="WHAT TO BRING">
              <Textarea value={whatToBring} onChange={(e) => setWhatToBring(e.target.value)} rows={2} placeholder="Racket, water, indoor shoes…" />
            </Field>
          </Section>

          <Section icon={ShieldCheck} title="POLICY & PRIVACY" hint="Set expectations before anyone books">
            <Field label="FREE CANCELLATION UNTIL">
              <div className="flex flex-wrap gap-1.5">
                {CANCEL_WINDOWS.map((h) => (
                  <button key={h} type="button" onClick={() => setCancellationHours(h)}
                    className={`rounded-lg px-3 py-1.5 font-display text-[10px] tracking-wider ${cancellationHours === h ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {h === 0 ? "NO REFUND" : `${h}H BEFORE`}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="POLICY NOTE">
              <Textarea value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={2} placeholder="e.g. Cancel later than 24h and the spot is charged." />
            </Field>
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
              <span className="flex items-center gap-2 font-display text-[10px] tracking-wider text-muted-foreground">
                <Eye size={12} /> SHOW ATTENDEE LIST PUBLICLY
              </span>
              <Switch checked={attendeesVisible} onCheckedChange={setAttendeesVisible} />
            </div>
            <p className="font-body text-[11px] text-muted-foreground">
              {attendeesVisible
                ? "Anyone browsing sees who's coming and their level — great for filling classes."
                : "Only the coach and confirmed attendees see the group."}
            </p>
          </Section>

          <Section icon={ImageIcon} title="MEDIA" hint="Photos and videos sell the session">
            <Field label="COVER IMAGE URL">
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
            </Field>
            <UrlList label="GALLERY PHOTOS" placeholder="https://… photo" list={mediaUrls} setList={setMediaUrls} draft={mediaDraft} setDraft={setMediaDraft} />
            <UrlList label="VIDEOS (YOUTUBE OR MP4)" placeholder="https://… video" list={videoUrls} setList={setVideoUrls} draft={videoDraft} setDraft={setVideoDraft} />
          </Section>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-3">
            <div>
              <p className="font-display text-[11px] tracking-wider text-foreground">{isDraft ? "SAVE AS DRAFT" : "PUBLISH NOW"}</p>
              <p className="font-body text-[11px] text-muted-foreground">Drafts stay hidden from players.</p>
            </div>
            <Switch checked={!isDraft} onCheckedChange={(v) => setIsDraft(!v)} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-sm tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {saving ? "SAVING…" : event ? "UPDATE CLASS" : "CREATE CLASS"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateEventDrawer;
