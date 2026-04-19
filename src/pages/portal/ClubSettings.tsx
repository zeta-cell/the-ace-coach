import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/hooks/useClub";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ClubSettings = () => {
  const { user } = useAuth();
  const { activeClub, activeClubId, isManager } = useClub();
  const [form, setForm] = useState({
    name: "", slug: "", logo_url: "", address: "", city: "", country: "", contact_email: "", contact_phone: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(!activeClubId);

  useEffect(() => {
    if (!activeClubId) { setCreateMode(true); return; }
    setCreateMode(false);
    (async () => {
      const { data } = await supabase.from("clubs").select("*").eq("id", activeClubId).single();
      if (data) setForm({
        name: data.name || "", slug: data.slug || "", logo_url: data.logo_url || "",
        address: data.address || "", city: data.city || "", country: data.country || "",
        contact_email: data.contact_email || "", contact_phone: data.contact_phone || "", description: data.description || "",
      });
    })();
  }, [activeClubId]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    if (createMode) {
      const { error } = await supabase.from("clubs").insert({ ...form, owner_id: user.id, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, "-") });
      if (error) toast.error(error.message); else { toast.success("Club created"); window.location.href = "/club"; }
    } else {
      const { error } = await supabase.from("clubs").update(form).eq("id", activeClubId!);
      if (error) toast.error(error.message); else toast.success("Saved");
    }
    setLoading(false);
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">{createMode ? "Create Club" : "Club Settings"}</h1>

        <Card className="p-6 space-y-4">
          <div>
            <Label>Club name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="my-club" />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><Label>Contact phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <Button onClick={handleSave} disabled={loading || !form.name} className="w-full">
            {loading ? "Saving…" : createMode ? "Create Club" : "Save Changes"}
          </Button>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ClubSettings;
