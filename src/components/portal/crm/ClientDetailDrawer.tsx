import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, Calendar, MessageSquare, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Client {
  id: string; full_name: string; email: string | null; phone: string | null;
  pipeline_stage: string; tags: string[] | null; notes: string | null;
  lifetime_value: number; source: string | null; linked_user_id: string | null;
  last_contact_at: string | null; owner_id: string; owner_type: string;
}
interface Activity { id: string; type: string; body: string | null; created_at: string; }
interface Stage { stage_key: string; name: string; color: string | null; }

const ClientDetailDrawer = ({ clientId, open, onClose, stages, onUpdated }: { clientId: string | null; open: boolean; onClose: () => void; stages: Stage[]; onUpdated: () => void; }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState("");
  const [activityType, setActivityType] = useState("note");

  useEffect(() => {
    if (!clientId || !open) return;
    (async () => {
      const { data } = await supabase.from("crm_clients").select("*").eq("id", clientId).single();
      if (data) setClient(data as Client);
      const { data: acts } = await supabase.from("crm_activities").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      setActivities((acts || []) as Activity[]);
    })();
  }, [clientId, open]);

  const updateField = async (field: string, value: any) => {
    if (!client) return;
    const { error } = await supabase.from("crm_clients").update({ [field]: value }).eq("id", client.id);
    if (error) { toast.error(error.message); return; }
    setClient({ ...client, [field]: value } as Client);
    onUpdated();
  };

  const addActivity = async () => {
    if (!client || !user || !newActivity.trim()) return;
    const { data, error } = await supabase.from("crm_activities").insert({
      client_id: client.id, type: activityType, body: newActivity, created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setActivities([data as Activity, ...activities]);
    setNewActivity("");
    await supabase.from("crm_clients").update({ last_contact_at: new Date().toISOString() }).eq("id", client.id);
  };

  const convertToPlayer = async () => {
    if (!client?.email) { toast.error("Client must have an email"); return; }
    // Try to find user by email
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", client.email).maybeSingle();
    if (!profile) { toast.error("No platform user found with this email — invite them first"); return; }
    if (client.owner_type === "coach") {
      const { error } = await supabase.from("coach_player_assignments").insert({ coach_id: client.owner_id, player_id: profile.user_id });
      if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    }
    await supabase.from("crm_clients").update({ linked_user_id: profile.user_id, pipeline_stage: "active" }).eq("id", client.id);
    toast.success("Converted to player");
    onUpdated();
    onClose();
  };

  const deleteClient = async () => {
    if (!client || !confirm("Delete this client?")) return;
    const { error } = await supabase.from("crm_clients").delete().eq("id", client.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    onUpdated();
    onClose();
  };

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>{client.full_name}</span>
            <Button variant="ghost" size="icon" onClick={deleteClient}><Trash2 size={16} className="text-destructive" /></Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Quick info */}
          <div className="space-y-2 text-sm">
            {client.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} />{client.email}</div>}
            {client.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} />{client.phone}</div>}
            {client.last_contact_at && <div className="flex items-center gap-2 text-muted-foreground"><Calendar size={14} />Last contact {format(new Date(client.last_contact_at), "MMM d")}</div>}
          </div>

          {/* Stage */}
          <div>
            <Label className="text-xs uppercase tracking-wider">Pipeline stage</Label>
            <Select value={client.pipeline_stage} onValueChange={(v) => updateField("pipeline_stage", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.stage_key} value={s.stage_key}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* LTV */}
          <div>
            <Label className="text-xs uppercase tracking-wider">Lifetime value (€)</Label>
            <Input type="number" defaultValue={client.lifetime_value} onBlur={(e) => updateField("lifetime_value", Number(e.target.value))} className="mt-1" />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs uppercase tracking-wider">Notes</Label>
            <Textarea defaultValue={client.notes || ""} onBlur={(e) => updateField("notes", e.target.value)} rows={3} className="mt-1" />
          </div>

          {/* Convert */}
          {!client.linked_user_id && (
            <Button onClick={convertToPlayer} variant="secondary" className="w-full">
              <UserPlus size={14} className="mr-2" /> Convert to Player
            </Button>
          )}
          {client.linked_user_id && <Badge variant="default">Linked Player</Badge>}

          {/* Activity timeline */}
          <div>
            <Label className="text-xs uppercase tracking-wider mb-2 block">Activity</Label>
            <div className="flex gap-2 mb-3">
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="Log activity…" onKeyDown={(e) => e.key === "Enter" && addActivity()} />
              <Button onClick={addActivity} size="sm">Add</Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity logged yet.</p>}
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-primary pl-3 py-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare size={10} />{a.type} · {format(new Date(a.created_at), "MMM d, HH:mm")}</div>
                  <p className="text-sm text-foreground mt-0.5">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailDrawer;
