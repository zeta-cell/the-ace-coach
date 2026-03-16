import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Circle, Grip, Layers } from "lucide-react";

interface SportPickerModalProps {
  userId: string;
  onComplete: () => void;
}

const TENNIS_STARTER_BLOCKS = [
  {
    title: "Tennis Baseline Session",
    description: "Complete baseline training session with warm-up, footwork drills and tennis-specific patterns",
    category: "tennis_drill",
    sport: "tennis",
    duration_minutes: 75,
    difficulty: "intermediate",
    goal: "Consistency & Footwork",
    goals: ["Consistency", "Footwork", "Patterns"],
  },
  {
    title: "Serve & Return Focus",
    description: "Dedicated serve mechanics and return of serve practice",
    category: "tennis_drill",
    sport: "tennis",
    duration_minutes: 60,
    difficulty: "intermediate",
    goal: "Serve Power",
    goals: ["Serve Power", "Return Placement"],
  },
  {
    title: "Match Preparation",
    description: "Physical and mental preparation for match day",
    category: "fitness",
    sport: "tennis",
    duration_minutes: 45,
    difficulty: "intermediate",
    goal: "Match Readiness",
    goals: ["Match Readiness", "Mental Focus"],
  },
];

const PADEL_STARTER_BLOCKS = [
  {
    title: "Padel Fundamentals",
    description: "Core padel skills: volleys, wall play and positioning",
    category: "padel_drill",
    sport: "padel",
    duration_minutes: 75,
    difficulty: "beginner",
    goal: "Wall Play & Volleys",
    goals: ["Wall Play", "Volleys", "Positioning"],
  },
  {
    title: "Wall Play & Bandeja",
    description: "Advanced wall shots and overhead techniques",
    category: "padel_drill",
    sport: "padel",
    duration_minutes: 60,
    difficulty: "intermediate",
    goal: "Bandeja & Wall Control",
    goals: ["Bandeja", "Vibora", "Wall Control"],
  },
  {
    title: "Padel Match Prep",
    description: "Tactical preparation and partner coordination for matches",
    category: "padel_drill",
    sport: "padel",
    duration_minutes: 45,
    difficulty: "intermediate",
    goal: "Tactics & Partnership",
    goals: ["Tactics", "Partnership", "Mental Game"],
  },
];

const SportPickerModal = ({ userId, onComplete }: SportPickerModalProps) => {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (sport: string) => {
    setSaving(true);
    try {
      // 1. Save primary_sport
      await supabase
        .from("coach_profiles")
        .update({ primary_sport: sport })
        .eq("user_id", userId);

      // 2. Create starter blocks
      const blocks =
        sport === "tennis"
          ? TENNIS_STARTER_BLOCKS
          : sport === "padel"
          ? PADEL_STARTER_BLOCKS
          : [...TENNIS_STARTER_BLOCKS, ...PADEL_STARTER_BLOCKS];

      for (const block of blocks) {
        await supabase.from("training_blocks").insert({
          ...block,
          coach_id: userId,
          is_system: false,
          is_custom: false,
          is_public: false,
          module_ids: [],
          module_durations: [],
          module_notes: [],
        });
      }

      const label = sport === "both" ? "Tennis & Padel" : sport.charAt(0).toUpperCase() + sport.slice(1);
      toast.success(`Your ${label} library is ready!`);
      onComplete();
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div className="space-y-2">
            <h1 className="font-display text-3xl text-foreground tracking-wide">
              WELCOME TO ACE!
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              What sport do you coach?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelect("tennis")}
              disabled={saving}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <Circle size={32} className="text-primary" />
              <span className="font-display text-sm tracking-wider text-foreground">TENNIS</span>
            </button>
            <button
              onClick={() => handleSelect("padel")}
              disabled={saving}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <Grip size={32} className="text-accent-foreground" />
              <span className="font-display text-sm tracking-wider text-foreground">PADEL</span>
            </button>
          </div>

          <button
            onClick={() => handleSelect("both")}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            <span className="text-xl">🎾🏓</span>
            <span className="font-display text-sm tracking-wider text-foreground">BOTH SPORTS</span>
          </button>

          <p className="font-body text-xs text-muted-foreground italic">
            Your choice unlocks the right training library
          </p>

          {saving && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-body text-xs text-muted-foreground">Setting up your library…</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SportPickerModal;
