import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCrmOwner } from "@/hooks/useCrmOwner";
import { toast } from "sonner";

interface Stage { stage_key: string; name: string; }

const NewClientDialog = ({ open, onClose, onCreated, stages }: { open: boolean; onClose: () => void; onCreated: () => void; stages: Stage[]; }) => {
  const { ownerId, ownerType } = useCrmOwner();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", source: "manual", pipeline_stage: "lead", notes: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!ownerId || !form.full_name) return;
    setLoading(true);
    const { error } = await supabase.from("crm_clients").insert({
      owner_id: ownerId, owner_type: ownerType, ...form, last_contact_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client added");
    setForm({ full_name: "", email: "", phone: "", source: "manual", pipeline_stage: "lead", notes: "" });
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pipeline stage</Label>
              <Select value={form.pipeline_stage} onValueChange={(v) => setForm({ ...form, pipeline_stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.stage_key} value={s.stage_key}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !form.full_name}>{loading ? "Saving…" : "Add Client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewClientDialog;
