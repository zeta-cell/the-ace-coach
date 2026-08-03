import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Star, Loader2 } from "lucide-react";

interface LocationRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  is_primary: boolean;
}

const emptyForm = { name: "", address: "", city: "", country: "", notes: "" };

const AcademyLocations = ({ clubId }: { clubId: string }) => {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("club_locations")
      .select("id, name, address, city, country, notes, is_primary")
      .eq("club_id", clubId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    setRows((data || []) as LocationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const add = async () => {
    if (!form.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("club_locations").insert({
      club_id: clubId,
      name: form.name.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      notes: form.notes.trim() || null,
      is_primary: rows.length === 0,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm(emptyForm);
    toast.success("Location added");
    load();
  };

  const makePrimary = async (id: string) => {
    await supabase.from("club_locations").update({ is_primary: false }).eq("club_id", clubId);
    const { error } = await supabase.from("club_locations").update({ is_primary: true }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Main location updated");
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this location?")) return;
    const { error } = await supabase.from("club_locations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Location removed");
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-display text-xs tracking-wider text-foreground">ADD TRAINING LOCATION</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Club / venue name"
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street address"
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City"
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Country"
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Arrival notes (parking, court access…)"
            className="sm:col-span-2 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={add}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ADD LOCATION
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground font-body text-sm">No locations yet — add your main venue first.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((l) => (
            <div key={l.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm tracking-wider text-foreground">{l.name}</span>
                    {l.is_primary && (
                      <span className="flex items-center gap-1 text-[10px] font-display tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        <Star size={10} /> MAIN
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {[l.address, l.city, l.country].filter(Boolean).join(", ") || "No address"}
                  </p>
                  {l.notes && <p className="font-body text-xs text-muted-foreground/80 mt-1">{l.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!l.is_primary && (
                  <button
                    onClick={() => makePrimary(l.id)}
                    className="font-display text-[10px] tracking-wider text-muted-foreground hover:text-primary"
                  >
                    SET MAIN
                  </button>
                )}
                <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademyLocations;
