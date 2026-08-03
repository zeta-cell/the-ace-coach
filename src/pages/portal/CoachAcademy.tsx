import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademy } from "@/hooks/useAcademy";
import PortalLayout from "@/components/portal/PortalLayout";
import AcademyHostClubs from "@/components/portal/academy/AcademyHostClubs";
import AcademyRoster from "@/components/portal/academy/AcademyRoster";
import AcademyTeamAvailability from "@/components/portal/academy/AcademyTeamAvailability";
import AcademySchedule from "@/components/portal/academy/AcademySchedule";
import { Building2, Users, Clock, CalendarDays, Loader2, Save, Lock } from "lucide-react";
import { toast } from "sonner";

type Tab = "settings" | "clubs" | "coaches" | "availability" | "schedule";

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "schedule", label: "TRAININGS & CAMPS", icon: CalendarDays },
  { key: "availability", label: "AVAILABILITY", icon: Clock },
  { key: "coaches", label: "COACHES", icon: Users },
  { key: "clubs", label: "CLUBS", icon: Building2 },
  { key: "settings", label: "ACADEMY", icon: Building2 },
];

const CoachAcademy = () => {
  const { user } = useAuth();
  const { academy, coaches, loading, reload, availableClubs, canCreateAcademy } = useAcademy();
  const [tab, setTab] = useState<Tab>("schedule");
  const [selfName, setSelfName] = useState("Me");

  // Create form
  const [newName, setNewName] = useState("");
  const [newClubId, setNewClubId] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [creating, setCreating] = useState(false);

  // Settings form
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", country: "", contact_email: "", contact_phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSelfName(data?.full_name || "Me"));
  }, [user]);

  useEffect(() => {
    if (!newClubId && availableClubs.length) {
      const c = availableClubs[0];
      setNewClubId(c.id);
      setNewAddress((v) => v || c.address || "");
      setNewCity((v) => v || c.city || "");
      setNewCountry((v) => v || c.country || "");
    }
  }, [availableClubs, newClubId]);

  useEffect(() => {
    if (academy) {
      setForm({
        name: academy.name || "",
        description: academy.description || "",
        address: academy.address || "",
        city: academy.city || "",
        country: academy.country || "",
        contact_email: academy.contact_email || "",
        contact_phone: academy.contact_phone || "",
      });
    }
  }, [academy]);

  const createAcademy = async () => {
    if (!user || !newName.trim()) {
      toast.error("Academy name is required");
      return;
    }
    if (!newClubId) {
      toast.error("Pick the club that owns this academy");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("academies").insert({
      club_id: newClubId,
      owner_id: user.id,
      name: newName.trim(),
      address: newAddress.trim() || null,
      city: newCity.trim() || null,
      country: newCountry.trim() || null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Academy created");
    reload();
  };

  const saveSettings = async () => {
    if (!academy) return;
    setSaving(true);
    const { error } = await supabase
      .from("academies")
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
      })
      .eq("id", academy.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Academy updated");
      reload();
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

  return (
    <PortalLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-wider text-foreground">MY ACADEMY</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            An academy belongs to one club, but can train at several. Court rentals stay with the clubs.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : !academy ? (
          canCreateAcademy ? (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 max-w-xl">
              <h2 className="font-display text-sm tracking-wider text-foreground">CREATE YOUR ACADEMY</h2>
              <p className="font-body text-xs text-muted-foreground">
                Pick the club that owns the academy — each club can own one academy. You can add more clubs and coaches right after.
              </p>
              <select value={newClubId} onChange={(e) => setNewClubId(e.target.value)} className={inputCls}>
                {availableClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.city ? ` · ${c.city}` : ""}
                  </option>
                ))}
              </select>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Academy name" className={inputCls} />
              <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Main address" className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" className={inputCls} />
                <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} placeholder="Country" className={inputCls} />
              </div>
              <button
                onClick={createAcademy}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider disabled:opacity-60"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />} CREATE ACADEMY
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-primary" />
                <h2 className="font-display text-sm tracking-wider text-foreground">AN ACADEMY NEEDS A CLUB</h2>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Only a club owner or club manager can create an academy. Without a club you can still run your own camps,
                clinics and trainings as events — and get added to someone else's academy roster.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to="/coach/calendar"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider"
                >
                  MY CAMPS & CLINICS
                </Link>
                <Link
                  to="/for-clubs"
                  className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground font-display text-[11px] tracking-wider"
                >
                  REGISTER A CLUB
                </Link>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="flex gap-1 bg-secondary rounded-lg p-0.5 overflow-x-auto scrollbar-none">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 min-w-[120px] py-2.5 rounded-md font-display text-[10px] tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {tab === "schedule" && user && (
              <AcademySchedule coaches={coaches} selfId={user.id} selfName={selfName} />
            )}

            {tab === "availability" && user && (
              <AcademyTeamAvailability coaches={coaches} selfId={user.id} selfName={selfName} />
            )}

            {tab === "coaches" && (
              <AcademyRoster
                academyId={academy.id}
                clubId={academy.club_id}
                coaches={coaches}
                ownerId={academy.owner_id}
                onChanged={reload}
              />
            )}

            {tab === "clubs" && <AcademyHostClubs academyId={academy.id} homeClubId={academy.club_id} />}

            {tab === "settings" && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 max-w-xl">
                <h2 className="font-display text-sm tracking-wider text-foreground">ACADEMY DETAILS</h2>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Academy name" className={inputCls} />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                  rows={3}
                  className={inputCls}
                />
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Main address" className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className={inputCls} />
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="Contact email" className={inputCls} />
                  <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="Contact phone" className={inputCls} />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} SAVE
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default CoachAcademy;
