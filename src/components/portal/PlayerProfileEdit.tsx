import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";

interface PlayerEditData {
  nationality: string;
  date_of_birth: string;
  dominant_hand: string;
  years_playing: number;
  fitness_level: string;
  playtomic_level: string;
  playtomic_url: string;
  goals: string[];
  injuries: string;
  best_shot: string;
  weakest_shot: string;
  preferred_sport: string;
  favourite_players: string[];
  club_name: string;
  club_location: string;
  shirt_size: string;
  target_ranking: string;
  plays_since_year: string;
  preferred_court_surface: string;
  training_freq: string;
  current_usta_ntrp: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  playerData: any;
  phone: string | null;
  onSaved: () => void;
}

const TagInput = ({ label, tags, onChange, placeholder }: { label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) => {
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
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-destructive"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder || `Add ${label.toLowerCase()}…`} className="h-9 text-sm" />
        <button type="button" onClick={add} className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"><Plus size={16} /></button>
      </div>
    </div>
  );
};

const ChipSelect = ({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="font-display text-xs tracking-wider text-muted-foreground">{label}</label>
    <div className="flex flex-wrap gap-2 mt-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors ${
            value === opt.value ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const PlayerProfileEdit = ({ open, onClose, playerData, phone, onSaved }: Props) => {
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editPhone, setEditPhone] = useState(phone || "");
  const [form, setForm] = useState<PlayerEditData>({
    nationality: playerData?.nationality || "",
    date_of_birth: playerData?.date_of_birth || "",
    dominant_hand: playerData?.dominant_hand || "",
    years_playing: playerData?.years_playing || 0,
    fitness_level: playerData?.fitness_level || "beginner",
    playtomic_level: playerData?.playtomic_level?.toString() || "",
    playtomic_url: playerData?.playtomic_url || "",
    goals: playerData?.goals || [],
    injuries: playerData?.injuries || "",
    best_shot: playerData?.best_shot || "",
    weakest_shot: playerData?.weakest_shot || "",
    preferred_sport: playerData?.preferred_sport || "padel",
    favourite_players: playerData?.favourite_players || [],
    club_name: playerData?.club_name || "",
    club_location: playerData?.club_location || "",
    shirt_size: playerData?.shirt_size || "",
    target_ranking: playerData?.target_ranking || "",
    plays_since_year: playerData?.plays_since_year?.toString() || "",
    preferred_court_surface: playerData?.preferred_court_surface || "",
    training_freq: playerData?.training_freq || "occasional",
    current_usta_ntrp: playerData?.current_usta_ntrp?.toString() || "",
  });

  const set = (key: keyof PlayerEditData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const [{ error: playerErr }, { error: profileErr }] = await Promise.all([
        supabase
          .from("player_profiles")
          .update({
            nationality: form.nationality || null,
            date_of_birth: form.date_of_birth || null,
            dominant_hand: (form.dominant_hand || null) as any,
            years_playing: form.years_playing || 0,
            fitness_level: (form.fitness_level || "beginner") as any,
            playtomic_level: form.playtomic_level ? parseFloat(form.playtomic_level) : null,
            playtomic_url: form.playtomic_url || null,
            goals: form.goals,
            injuries: form.injuries || null,
            best_shot: form.best_shot || null,
            weakest_shot: form.weakest_shot || null,
            preferred_sport: (form.preferred_sport || null) as any,
            favourite_players: form.favourite_players,
            club_name: form.club_name || null,
            club_location: form.club_location || null,
            shirt_size: form.shirt_size || null,
            target_ranking: form.target_ranking || null,
            plays_since_year: form.plays_since_year ? parseInt(form.plays_since_year) : null,
            preferred_court_surface: form.preferred_court_surface || null,
            training_freq: (form.training_freq || null) as any,
            current_usta_ntrp: form.current_usta_ntrp ? parseFloat(form.current_usta_ntrp) : null,
          } as any)
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .update({ phone: editPhone || null })
          .eq("user_id", user.id),
      ]);

      if (playerErr) throw playerErr;
      if (profileErr) throw profileErr;
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

  const Field = ({ label, field, type = "text", placeholder = "" }: { label: string; field: keyof PlayerEditData; type?: string; placeholder?: string }) => (
    <div>
      <label className="font-display text-xs tracking-wider text-muted-foreground">{label}</label>
      <Input type={type} value={form[field] as string} onChange={(e) => set(field, type === "number" ? Number(e.target.value) : e.target.value)} placeholder={placeholder} className="mt-1.5 h-9 text-sm" />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg tracking-wider">EDIT PROFILE</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-24">
          {/* Personal */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">PERSONAL</h3>
            <Field label="NATIONALITY" field="nationality" placeholder="e.g. Spanish" />
            <Field label="DATE OF BIRTH" field="date_of_birth" type="date" />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">PHONE</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+34 …" className="mt-1.5 h-9 text-sm" />
            </div>
            <Field label="YEARS PLAYING" field="years_playing" type="number" />
            <Field label="SHIRT SIZE" field="shirt_size" placeholder="e.g. M, L, XL" />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">DOMINANT HAND</label>
              <div className="flex gap-2 mt-1.5">
                {["left", "right"].map((h) => (
                  <button key={h} type="button" onClick={() => set("dominant_hand", h)}
                    className={`flex-1 py-2 rounded-lg text-sm font-display tracking-wider transition-colors ${form.dominant_hand === h ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {h.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Sport Preferences */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">SPORT PREFERENCES</h3>
            <ChipSelect
              label="PREFERRED SPORT"
              value={form.preferred_sport}
              onChange={(v) => set("preferred_sport", v)}
              options={[
                { value: "tennis", label: "TENNIS" },
                { value: "padel", label: "PADEL" },
                { value: "both", label: "BOTH" },
              ]}
            />
            <ChipSelect
              label="TRAINING FREQUENCY"
              value={form.training_freq}
              onChange={(v) => set("training_freq", v)}
              options={[
                { value: "daily", label: "DAILY" },
                { value: "3-4x_week", label: "3–4×/WEEK" },
                { value: "1-2x_week", label: "1–2×/WEEK" },
                { value: "occasional", label: "OCCASIONAL" },
              ]}
            />
            <ChipSelect
              label="PREFERRED COURT SURFACE"
              value={form.preferred_court_surface}
              onChange={(v) => set("preferred_court_surface", v)}
              options={[
                { value: "clay", label: "CLAY" },
                { value: "hard", label: "HARD" },
                { value: "grass", label: "GRASS" },
                { value: "artificial_grass", label: "ARTIFICIAL" },
                { value: "indoor", label: "INDOOR" },
              ]}
            />
            <TagInput label="FAVOURITE PLAYERS" tags={form.favourite_players} onChange={(t) => set("favourite_players", t)} placeholder="e.g. Djokovic, Lebron Chila…" />
            <Field label="TARGET RANKING" field="target_ranking" placeholder="e.g. Top 100 local" />
          </section>

          {/* Club */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">MY CLUB</h3>
            <Field label="CLUB NAME" field="club_name" placeholder="e.g. Padel Club London" />
            <Field label="CLUB LOCATION" field="club_location" placeholder="e.g. London, UK" />
          </section>

          {/* Fitness & Goals */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">FITNESS & GOALS</h3>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">FITNESS LEVEL</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {["beginner", "intermediate", "advanced", "elite"].map((l) => (
                  <button key={l} type="button" onClick={() => set("fitness_level", l)}
                    className={`py-2 rounded-lg text-xs font-display tracking-wider transition-colors ${form.fitness_level === l ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <TagInput label="GOALS" tags={form.goals} onChange={(t) => set("goals", t)} />
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">INJURIES / NOTES</label>
              <Textarea value={form.injuries} onChange={(e) => set("injuries", e.target.value)} className="mt-1.5 text-sm min-h-[60px]" />
            </div>
          </section>

          {/* Ratings */}
          <section className="space-y-3">
            <h3 className="font-display text-xs tracking-wider text-muted-foreground border-b border-border pb-2">RATINGS</h3>
            <Field label="PLAYTOMIC LEVEL" field="playtomic_level" type="number" />
            <Field label="PLAYTOMIC URL" field="playtomic_url" placeholder="https://…" />
            <Field label="USTA/NTRP RATING" field="current_usta_ntrp" type="number" placeholder="e.g. 3.5" />
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
          <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlayerProfileEdit;
