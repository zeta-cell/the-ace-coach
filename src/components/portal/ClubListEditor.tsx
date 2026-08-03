import { Building2, Plus, X } from "lucide-react";
import { MAX_CLUBS, PlayerClub } from "@/lib/coachInvite";

interface Props {
  value: PlayerClub[];
  onChange: (clubs: PlayerClub[]) => void;
  label?: string;
}

/** Free-text list of up to 4 clubs (name + city) a player trains at. */
const ClubListEditor = ({ value, onChange, label = "MY CLUBS" }: Props) => {
  const clubs = value.length ? value : [];

  const update = (i: number, patch: Partial<PlayerClub>) =>
    onChange(clubs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const add = () => {
    if (clubs.length >= MAX_CLUBS) return;
    onChange([...clubs, { name: "", city: "" }]);
  };

  const remove = (i: number) => onChange(clubs.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
          <Building2 size={13} className="text-primary" /> {label}
        </label>
        <span className="font-body text-[10px] text-muted-foreground">
          {clubs.length}/{MAX_CLUBS}
        </span>
      </div>

      <div className="mt-2 space-y-2">
        {clubs.length === 0 && (
          <p className="font-body text-xs text-muted-foreground">No club yet — add up to {MAX_CLUBS}.</p>
        )}
        {clubs.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={c.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Club name"
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg border border-border bg-secondary px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={c.city}
              onChange={(e) => update(i, { city: e.target.value })}
              placeholder="City"
              maxLength={80}
              className="min-w-0 w-28 rounded-lg border border-border bg-secondary px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove club"
              className="shrink-0 h-9 w-9 rounded-lg bg-secondary text-muted-foreground hover:text-destructive flex items-center justify-center"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {clubs.length < MAX_CLUBS && (
        <button
          type="button"
          onClick={add}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 font-display text-[11px] tracking-wider text-primary hover:bg-primary/20"
        >
          <Plus size={14} /> ADD CLUB
        </button>
      )}
    </div>
  );
};

export default ClubListEditor;
