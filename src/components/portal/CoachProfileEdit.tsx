import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";

interface CoachEditData {
  primary_sport: string;
  profile_slug: string;
  location_city: string;
  location_country: string;
  response_time_hours: number;
  bio: string;
  coaching_style: string;
  phone: string;
  nationality: string;
  years_experience: number;
  dominant_hand: string;
  preferred_side: string;
  playtomic_level: string;
  playtomic_url: string;
  racket_brand: string;
  racket_model: string;
  racket_type: string;
  certifications: string[];
  languages: string[];
  specializations: string[];
  best_shot: string;
  weakest_shot: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  coachData: any;
  onSaved: () => void;
}

const TagInput = ({ label, tags, onChange }: { label: string; tags: string[]; onChange: (t: string[]) => void }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInput("");
    }
  };
  return (
    <div>
      <label className="font-display text-xs tracking-wider text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-body">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-destructive">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={`Add ${label.toLowerCase()}…`}
          className="h-9 text-sm"
        />
        <button type="button" onClick={add} className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const RESPONSE_TIME_OPTIONS = [1, 6, 12, 24, 48];

const CoachProfileEdit = ({ open, onClose, coachData, onSaved }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [form, setForm] = useState<CoachEditData>({
    primary_sport: coachData?.primary_sport || "",
    profile_slug: coachData?.profile_slug || "",
    location_city: coachData?.location_city || "",
    location_country: coachData?.location_country || "",
    response_time_hours: coachData?.response_time_hours || 24,
    bio: coachData?.bio || "",
    coaching_style: coachData?.coaching_style || "",
    phone: coachData?.phone || "",
    nationality: coachData?.nationality || "",
    years_experience: coachData?.years_experience || 0,
    dominant_hand: coachData?.dominant_hand || "",
    preferred_side: coachData?.preferred_side || "",
    playtomic_level: coachData?.playtomic_level?.toString() || "",
    playtomic_url: coachData?.playtomic_url || "",
    racket_brand: coachData?.racket_brand || "",
    racket_model: coachData?.racket_model || "",
    racket_type: coachData?.racket_type || "",
    certifications: coachData?.certifications || [],
    languages: coachData?.languages || [],
    specializations: coachData?.specializations || [],
    best_shot: coachData?.best_shot || "",
    weakest_shot: coachData?.weakest_shot || "",
  });

  // Auto-suggest slug from full name if empty
  useEffect(() => {
    if (!form.profile_slug && profile?.full_name) {
      const suggested = profile.full_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (suggested) {
        setForm((f) => ({ ...f, profile_slug: suggested }));
      }
    }
  }, [open]);

  const set = (key: keyof CoachEditData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    set("profile_slug", cleaned);
    if (cleaned && !/^[a-z0-9-]+$/.test(cleaned)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
    } else {
      setSlugError("");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (form.profile_slug && !/^[a-z0-9-]+$/.test(form.profile_slug)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("coach_profiles")
        .update({
          primary_sport: form.primary_sport || null,
          profile_slug: form.profile_slug || null,
          location_city: form.location_city || null,
          location_country: form.location_country || null,
          response_time_hours: form.response_time_hours,
          bio: form.bio || null,
          coaching_style: form.coaching_style || null,
          phone: form.phone || null,
          nationality: form.nationality || null,
          years_experience: form.years_experience || 0,
          dominant_hand: (form.dominant_hand || null) as any,
          preferred_side: form.preferred_side || null,
          playtomic_level: form.playtomic_level ? parseFloat(form.playtomic_level) : null,
          playtomic_url: form.playtomic_url || null,
          racket_brand: form.racket_brand || null,
          racket_model: form.racket_model || null,
          racket_type: (form.racket_type || null) as any,
          certifications: form.certifications,
          languages: form.languages,
          specializations: form.specializations,
          best_shot: form.best_shot || null,
          weakest_shot: form.weakest_shot || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile updated" });
      await refreshProfile();
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, field, type = "text", placeholder = "" }: { label: string; field: keyof CoachEditData; type?: string; placeholder?: string }) => (
    <div>
      <label className="font-display text-xs tracking-wider text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={form[field] as string}
        onChange={(e) => set(field, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-9 text-sm"
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg tracking-wider">EDIT PROFILE</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-24">
          {/* SPORT SELECTION */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">YOUR SPORT</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["padel", "tennis"] as const).map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => set("primary_sport", sport)}
                  className={`py-3 rounded-xl border-2 font-display text-sm tracking-wider transition-all ${
                    form.primary_sport === sport
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {sport === "padel" ? "🏓 PADEL" : "🎾 TENNIS"}
                </button>
              ))}
            </div>
            {!form.primary_sport && (
              <p className="text-xs font-body text-amber-400">Please select your sport to receive the correct training modules.</p>
            )}
          </section>

          {/* PUBLIC PROFILE */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">PUBLIC PROFILE</h3>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">YOUR PUBLIC PROFILE URL</label>
              <div className="flex items-center mt-1.5">
                <span className="h-9 px-3 flex items-center rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-body whitespace-nowrap">
                  app.com/coach/
                </span>
                <Input
                  value={form.profile_slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="patrick-mouratoglou"
                  className="h-9 text-sm rounded-l-none"
                />
              </div>
              {slugError && <p className="text-destructive text-xs font-body mt-1">{slugError}</p>}
              <p className="text-muted-foreground text-[10px] font-body mt-1">
                This is your shareable profile link. Use your real name e.g. patrick-mouratoglou
              </p>
            </div>
            <Field label="CITY" field="location_city" placeholder="e.g. Barcelona" />
            <Field label="COUNTRY" field="location_country" placeholder="e.g. Spain" />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">TYPICAL RESPONSE TIME</label>
              <div className="flex gap-2 mt-1.5">
                {RESPONSE_TIME_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => set("response_time_hours", h)}
                    className={`flex-1 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${
                      form.response_time_hours === h ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {h}H
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Personal */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">PERSONAL</h3>
            <Field label="NATIONALITY" field="nationality" placeholder="e.g. Spanish" />
            <Field label="PHONE" field="phone" placeholder="+34 …" />
            <Field label="YEARS EXPERIENCE" field="years_experience" type="number" />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">DOMINANT HAND</label>
              <div className="flex gap-2 mt-1.5">
                {["left", "right"].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => set("dominant_hand", h)}
                    className={`flex-1 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${
                      form.dominant_hand === h ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {h.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* About */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">ABOUT</h3>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">BIO</label>
              <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5 text-sm min-h-[80px]" />
            </div>
            <Field label="COACHING STYLE" field="coaching_style" placeholder="e.g. Technical, Tactical" />
          </section>

          {/* Tags */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">EXPERTISE</h3>
            <TagInput label="CERTIFICATIONS" tags={form.certifications} onChange={(t) => set("certifications", t)} />
            <TagInput label="LANGUAGES" tags={form.languages} onChange={(t) => set("languages", t)} />
            <TagInput label="SPECIALIZATIONS" tags={form.specializations} onChange={(t) => set("specializations", t)} />
          </section>

          {/* Playtomic */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">PLAYTOMIC</h3>
            <Field label="LEVEL" field="playtomic_level" type="number" />
            <Field label="PROFILE URL" field="playtomic_url" placeholder="https://…" />
          </section>

          {/* Racket */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">RACKET</h3>
            <Field label="BRAND" field="racket_brand" placeholder="e.g. Bullpadel" />
            <Field label="MODEL" field="racket_model" placeholder="e.g. Vertex 03" />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">TYPE</label>
              <div className="flex gap-2 mt-1.5">
                {["power", "control", "mixed"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("racket_type", t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${
                      form.racket_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Play style */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">PLAY STYLE</h3>
            <Field label="BEST SHOT" field="best_shot" placeholder="e.g. Volley" />
            <Field label="WEAKEST SHOT" field="weakest_shot" placeholder="e.g. Lob" />
          </section>
        </div>

        {/* Sticky save */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CoachProfileEdit;
