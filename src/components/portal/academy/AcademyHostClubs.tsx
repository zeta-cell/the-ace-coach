import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Plus, Trash2, Star, Loader2, Search } from "lucide-react";

interface HostClub {
  id: string;
  club_id: string;
  is_primary: boolean;
  name: string;
  city: string | null;
  address: string | null;
}

interface Props {
  academyId: string;
  homeClubId: string;
}

const AcademyHostClubs = ({ academyId, homeClubId }: Props) => {
  const [rows, setRows] = useState<HostClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("academy_clubs")
      .select("id, club_id, is_primary, clubs!inner(name, city, address)")
      .eq("academy_id", academyId)
      .order("is_primary", { ascending: false });
    setRows(
      (data || []).map((r) => {
        const c = (r as unknown as { clubs: { name: string; city: string | null; address: string | null } }).clubs;
        return {
          id: r.id,
          club_id: r.club_id,
          is_primary: r.is_primary,
          name: c?.name || "Club",
          city: c?.city ?? null,
          address: c?.address ?? null,
        };
      }),
    );
    setLoading(false);
  }, [academyId]);

  useEffect(() => {
    load();
  }, [load]);

  const search = async () => {
    if (query.trim().length < 2) return;
    const { data } = await supabase
      .from("clubs")
      .select("id, name, city")
      .ilike("name", `%${query.trim()}%`)
      .eq("is_active", true)
      .limit(8);
    setResults(data || []);
  };

  const addClub = async (clubId: string) => {
    setBusy(true);
    const { error } = await supabase.from("academy_clubs").insert({ academy_id: academyId, club_id: clubId });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Club added");
      setQuery("");
      setResults([]);
      load();
    }
  };

  const makePrimary = async (id: string) => {
    await supabase.from("academy_clubs").update({ is_primary: false }).eq("academy_id", academyId);
    const { error } = await supabase.from("academy_clubs").update({ is_primary: true }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Main club updated");
      load();
    }
  };

  const remove = async (row: HostClub) => {
    if (row.club_id === homeClubId) {
      toast.error("The owning club cannot be removed from its academy");
      return;
    }
    if (!confirm("Remove this club from your academy?")) return;
    const { error } = await supabase.from("academy_clubs").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      load();
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-display text-xs tracking-wider text-foreground">ADD A CLUB YOU TRAIN AT</h3>
        <p className="font-body text-[11px] text-muted-foreground">
          Your academy can run trainings and camps at several clubs. Courts are rented out by the clubs themselves.
        </p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search club by name"
            className={inputCls}
          />
          <button
            onClick={search}
            className="px-3 rounded-lg bg-secondary border border-border text-foreground shrink-0"
            aria-label="Search clubs"
          >
            <Search size={16} />
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => addClub(r.id)}
                disabled={busy || rows.some((x) => x.club_id === r.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary text-left disabled:opacity-40"
              >
                <span className="font-body text-sm text-foreground truncate">
                  {r.name}
                  {r.city ? ` · ${r.city}` : ""}
                </span>
                <Plus size={14} className="text-primary shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Building2 size={16} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-display text-sm tracking-wider text-foreground truncate">{r.name}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">
                    {[r.address, r.city].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {r.club_id === homeClubId && (
                  <span className="font-display text-[10px] tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    OWNER CLUB
                  </span>
                )}
                {r.is_primary ? (
                  <span className="flex items-center gap-1 font-display text-[10px] tracking-wider text-primary">
                    <Star size={12} /> MAIN
                  </span>
                ) : (
                  <button
                    onClick={() => makePrimary(r.id)}
                    className="font-display text-[10px] tracking-wider text-muted-foreground hover:text-primary"
                  >
                    SET MAIN
                  </button>
                )}
                {r.club_id !== homeClubId && (
                  <button onClick={() => remove(r)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademyHostClubs;
