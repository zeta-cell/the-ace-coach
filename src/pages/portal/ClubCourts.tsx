import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Square } from "lucide-react";
import { toast } from "sonner";

interface Court {
  id: string;
  court_number: string;
  surface: string | null;
  is_indoor: boolean;
  notes: string | null;
  is_active: boolean;
}

const ClubCourts = () => {
  const { activeClub, activeClubId } = useClub();
  const [courts, setCourts] = useState<Court[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ court_number: "", surface: "", is_indoor: false, notes: "" });

  const load = async () => {
    if (!activeClubId) return;
    const { data } = await supabase.from("club_courts").select("*").eq("club_id", activeClubId).order("court_number");
    setCourts(data || []);
  };
  useEffect(() => { load(); }, [activeClubId]);

  const handleAdd = async () => {
    if (!activeClubId || !form.court_number) return;
    const { error } = await supabase.from("club_courts").insert({
      club_id: activeClubId,
      court_number: form.court_number,
      surface: form.surface || null,
      is_indoor: form.is_indoor,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Court added");
    setForm({ court_number: "", surface: "", is_indoor: false, notes: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this court?")) return;
    const { error } = await supabase.from("club_courts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Courts</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={14} className="mr-2" /> Add Court</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Court</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Court number / name *</Label>
                  <Input value={form.court_number} onChange={(e) => setForm({ ...form, court_number: e.target.value })} placeholder="1, 2, Center Court…" />
                </div>
                <div>
                  <Label>Surface</Label>
                  <Input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="Clay, Hard, Grass, Glass…" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Indoor</Label>
                  <Switch checked={form.is_indoor} onCheckedChange={(v) => setForm({ ...form, is_indoor: v })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                </div>
                <Button onClick={handleAdd} className="w-full">Add Court</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Square className="text-primary" size={20} />
                  <div className="font-display text-lg text-foreground">Court {c.court_number}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
              <div className="space-y-1 text-xs font-body text-muted-foreground">
                {c.surface && <div>Surface: <span className="text-foreground">{c.surface}</span></div>}
                <div>{c.is_indoor ? "Indoor" : "Outdoor"}</div>
                {c.notes && <div className="italic">{c.notes}</div>}
              </div>
            </Card>
          ))}
          {courts.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No courts yet. Add one to enable per-court booking.</p>}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ClubCourts;
