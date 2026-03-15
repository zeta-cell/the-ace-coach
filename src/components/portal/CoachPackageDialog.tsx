import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CoachPackage } from "./CoachPackageCard";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<CoachPackage, "id" | "is_active" | "created_at">) => void;
  editing: CoachPackage | null;
  saving: boolean;
}

const SESSION_TYPES = ["individual", "group", "kids", "online"] as const;
const SPORTS = ["tennis", "padel", "both"] as const;
const CURRENCIES = ["EUR", "USD", "GBP"] as const;

const CoachPackageDialog = ({ open, onClose, onSave, editing, saving }: Props) => {
  const [form, setForm] = useState({
    title: "",
    session_type: "individual" as string,
    sport: "padel" as string,
    duration_minutes: 60,
    price_per_session: 0,
    total_sessions: null as number | null,
    currency: "EUR",
    description: "",
    max_group_size: null as number | null,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        session_type: editing.session_type,
        sport: editing.sport,
        duration_minutes: editing.duration_minutes,
        price_per_session: Number(editing.price_per_session),
        total_sessions: editing.total_sessions,
        currency: editing.currency,
        description: editing.description || "",
        max_group_size: editing.max_group_size,
      });
    } else {
      setForm({
        title: "", session_type: "individual", sport: "padel",
        duration_minutes: 60, price_per_session: 0, total_sessions: null,
        currency: "EUR", description: "", max_group_size: null,
      });
    }
  }, [editing, open]);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form as any);
  };

  const ChipSelect = ({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="font-display text-xs tracking-wider text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors ${
              value === opt ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">
            {editing ? "EDIT PACKAGE" : "CREATE PACKAGE"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">TITLE</label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Single Session, 10-Pack..."
              className="mt-1.5 h-9 text-sm"
              required
            />
          </div>

          <ChipSelect label="SESSION TYPE" options={SESSION_TYPES} value={form.session_type} onChange={(v) => set("session_type", v)} />
          <ChipSelect label="SPORT" options={SPORTS} value={form.sport} onChange={(v) => set("sport", v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">DURATION (MIN)</label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", Number(e.target.value))} className="mt-1.5 h-9 text-sm" min={15} step={15} />
            </div>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">PRICE / SESSION</label>
              <Input type="number" value={form.price_per_session} onChange={(e) => set("price_per_session", Number(e.target.value))} className="mt-1.5 h-9 text-sm" min={0} step={5} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">TOTAL SESSIONS</label>
              <Input
                type="number"
                value={form.total_sessions ?? ""}
                onChange={(e) => set("total_sessions", e.target.value ? Number(e.target.value) : null)}
                placeholder="∞ if empty"
                className="mt-1.5 h-9 text-sm"
                min={1}
              />
            </div>
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">CURRENCY</label>
              <div className="flex gap-1.5 mt-1.5">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("currency", c)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-display tracking-wider transition-colors ${
                      form.currency === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.session_type === "group" && (
            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">MAX GROUP SIZE</label>
              <Input type="number" value={form.max_group_size ?? ""} onChange={(e) => set("max_group_size", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 6" className="mt-1.5 h-9 text-sm" min={2} />
            </div>
          )}

          <div>
            <label className="font-display text-xs tracking-wider text-muted-foreground">DESCRIPTION</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What's included in this package…" className="mt-1.5 text-sm min-h-[60px]" />
          </div>

          <DialogFooter>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-display tracking-wider bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
              CANCEL
            </button>
            <button type="submit" disabled={saving || !form.title} className="px-4 py-2 rounded-lg text-sm font-display tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "SAVING…" : editing ? "UPDATE" : "CREATE"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CoachPackageDialog;
