import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { differenceInMinutes } from "date-fns";

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

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

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
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState("EUR");
  const [ageGroup, setAgeGroup] = useState("all");
  const [skillLevel, setSkillLevel] = useState("all");
  const [coverUrl, setCoverUrl] = useState("");
  const [description, setDescription] = useState("");
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
      setPrice(event.price_per_person?.toString() || "0");
      setCurrency(event.currency || "EUR");
      setAgeGroup(event.age_group || "all");
      setSkillLevel(event.skill_level || "all");
      setCoverUrl(event.cover_image_url || "");
      setDescription(event.description || "");
      setCourtNumber(event.court_number || "");
      setArrivalInstructions(event.arrival_instructions || "");
      setIsDraft(event.status === "draft");
    } else {
      setTitle(""); setEventType("clinic"); setSport("both");
      setStartDate(""); setStartTime(""); setEndDate(""); setEndTime("");
      setLocationName(""); setLocationAddress(""); setLocationCity(""); setLocationCountry("");
      setIsOnline(false); setMaxParticipants(""); setPrice("0"); setCurrency("EUR");
      setAgeGroup("all"); setSkillLevel("all"); setCoverUrl(""); setDescription("");
      setCourtNumber(""); setArrivalInstructions(""); setIsDraft(false);
    }
  }, [event, open]);

  const duration = startDate && startTime && endDate && endTime
    ? differenceInMinutes(new Date(`${endDate}T${endTime}`), new Date(`${startDate}T${startTime}`))
    : 0;
  const durationLabel = duration > 0 ? (duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ""}` : `${duration}m`) : "";

  const handleSave = async () => {
    if (!user || !title || !startDate || !startTime || !endDate || !endTime) {
      toast.error("Fill in required fields");
      return;
    }
    setSaving(true);
    const payload = {
      coach_id: user.id,
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
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      price_per_person: parseFloat(price) || 0,
      currency,
      age_group: ageGroup,
      skill_level: skillLevel,
      cover_image_url: coverUrl || null,
      description: description || null,
      court_number: courtNumber || null,
      arrival_instructions: arrivalInstructions || null,
      status: isDraft ? "draft" : "published",
    };

    let error;
    if (event) {
      ({ error } = await supabase.from("events").update(payload).eq("id", event.id));
    } else {
      ({ error } = await supabase.from("events").insert(payload));
    }

    if (error) { toast.error("Failed to save: " + error.message); setSaving(false); return; }
    toast.success(event ? "Event updated!" : "Event created!");
    setSaving(false);
    onSaved();
  };

  const ChipGroup = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {formatLabel(o).toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="font-display tracking-wider">{event ? "EDIT EVENT" : "CREATE EVENT"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-6">
          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">TITLE *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1.5 block">EVENT TYPE</label>
            <ChipGroup options={EVENT_TYPES} value={eventType} onChange={setEventType} />
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1.5 block">SPORT</label>
            <ChipGroup options={SPORTS} value={sport} onChange={setSport} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">START DATE *</label>
              <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} />
            </div>
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">START TIME *</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">END DATE *</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">END TIME *</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {durationLabel && (
            <p className="font-body text-xs text-muted-foreground">Duration: {durationLabel}</p>
          )}

          <div className="flex items-center gap-3">
            <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            <label className="font-display text-[10px] tracking-wider text-muted-foreground">ONLINE EVENT</label>
          </div>

          {!isOnline && (
            <>
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">LOCATION NAME</label>
                <Input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. Central Park Tennis Club" />
              </div>
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">ADDRESS</label>
                <Input value={locationAddress} onChange={e => setLocationAddress(e.target.value)} placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">CITY</label>
                  <Input value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="City" />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">COUNTRY</label>
                  <Input value={locationCountry} onChange={e => setLocationCountry(e.target.value)} placeholder="Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">COURT #</label>
                  <Input value={courtNumber} onChange={e => setCourtNumber(e.target.value)} placeholder="e.g. Court 4" />
                </div>
              </div>
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">ARRIVAL INSTRUCTIONS</label>
                <Textarea value={arrivalInstructions} onChange={e => setArrivalInstructions(e.target.value)} rows={2} placeholder="e.g. Reception → Court 4. Say 'I'm here for the clinic'" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">MAX PARTICIPANTS</label>
              <Input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">PRICE PER PERSON</label>
              <div className="flex gap-2">
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 = free" className="flex-1" />
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="bg-card border border-border rounded-md px-2 font-body text-xs text-foreground">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1.5 block">AGE GROUP</label>
            <ChipGroup options={AGE_GROUPS} value={ageGroup} onChange={setAgeGroup} />
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1.5 block">SKILL LEVEL</label>
            <ChipGroup options={SKILL_LEVELS} value={skillLevel} onChange={setSkillLevel} />
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">COVER IMAGE URL</label>
            <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isDraft} onCheckedChange={setIsDraft} />
            <label className="font-display text-[10px] tracking-wider text-muted-foreground">{isDraft ? "DRAFT" : "PUBLISHED"}</label>
          </div>

          <div>
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">DESCRIPTION</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Event description..." />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "SAVING..." : event ? "UPDATE EVENT" : "CREATE EVENT"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateEventDrawer;
