import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useCrmOwner } from "@/hooks/useCrmOwner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Users, TrendingUp, Euro, Search, LayoutGrid, List } from "lucide-react";
import NewClientDialog from "@/components/portal/crm/NewClientDialog";
import ClientDetailDrawer from "@/components/portal/crm/ClientDetailDrawer";
import { format } from "date-fns";

interface Client {
  id: string; full_name: string; email: string | null; phone: string | null;
  pipeline_stage: string; lifetime_value: number; source: string | null;
  last_contact_at: string | null; linked_user_id: string | null; tags: string[] | null;
}
interface Stage { stage_key: string; name: string; order_index: number; color: string | null; }

const Crm = () => {
  const { ownerId, ownerType } = useCrmOwner();
  const [clients, setClients] = useState<Client[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const refresh = async () => {
    if (!ownerId) return;
    setLoading(true);
    const [clientsRes, stagesRes] = await Promise.all([
      supabase.from("crm_clients").select("*").eq("owner_id", ownerId).eq("owner_type", ownerType).order("created_at", { ascending: false }),
      supabase.from("crm_pipeline_stages").select("*").eq("owner_id", ownerId).eq("owner_type", ownerType).order("order_index"),
    ]);

    let stageList = (stagesRes.data || []) as Stage[];
    // Auto-seed defaults if empty
    if (stageList.length === 0) {
      await supabase.rpc("seed_default_crm_stages", { _owner_id: ownerId, _owner_type: ownerType });
      const { data } = await supabase.from("crm_pipeline_stages").select("*").eq("owner_id", ownerId).eq("owner_type", ownerType).order("order_index");
      stageList = (data || []) as Stage[];
    }
    setStages(stageList);
    setClients((clientsRes.data || []) as Client[]);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [ownerId, ownerType]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const s = search.toLowerCase();
    return clients.filter((c) => c.full_name.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(s));
  }, [clients, search]);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.pipeline_stage === "active").length;
    const ltv = clients.reduce((sum, c) => sum + Number(c.lifetime_value || 0), 0);
    const pipelineValue = clients.filter((c) => !["active", "churned"].includes(c.pipeline_stage)).length * 200; // est
    return { total: clients.length, active, ltv, pipelineValue };
  }, [clients]);

  const dragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");
    if (!clientId) return;
    await supabase.from("crm_clients").update({ pipeline_stage: stageKey }).eq("id", clientId);
    refresh();
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">CRM</h1>
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">{ownerType === "club" ? "Club pipeline" : "Lead pipeline"}</p>
          </div>
          <Button onClick={() => setShowNew(true)}><Plus size={14} className="mr-1" /> New Client</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Clients", value: stats.total, icon: Users, color: "text-primary" },
            { label: "Active", value: stats.active, icon: TrendingUp, color: "text-accent" },
            { label: "Lifetime Value", value: `€${stats.ltv.toFixed(0)}`, icon: Euro, color: "text-foreground" },
            { label: "Pipeline (est.)", value: `€${stats.pipelineValue}`, icon: Euro, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <s.icon className={`${s.color} mb-2`} size={20} />
              <div className="text-xl font-display text-foreground">{s.value}</div>
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients…" className="pl-9" />
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban"><LayoutGrid size={14} /></TabsTrigger>
              <TabsTrigger value="list"><List size={14} /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : view === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto">
            {stages.map((stage) => {
              const stageClients = filtered.filter((c) => c.pipeline_stage === stage.stage_key);
              return (
                <div key={stage.stage_key} className="space-y-2 min-w-[200px]" onDragOver={dragOver} onDrop={(e) => onDrop(e, stage.stage_key)}>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || "hsl(var(--primary))" }} />
                      <span className="text-xs font-display uppercase tracking-wider text-foreground">{stage.name}</span>
                    </div>
                    <span className="text-xs font-body text-muted-foreground">{stageClients.length}</span>
                  </div>
                  <div className="space-y-2 min-h-32">
                    {stageClients.map((c) => (
                      <Card key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("clientId", c.id)} onClick={() => setSelectedClient(c.id)}
                        className="p-3 cursor-pointer hover:border-primary transition-colors">
                        <div className="text-sm font-body text-foreground truncate">{c.full_name}</div>
                        {c.email && <div className="text-[10px] text-muted-foreground truncate mt-0.5">{c.email}</div>}
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {c.source && <Badge variant="secondary" className="text-[9px] px-1 py-0">{c.source}</Badge>}
                          {c.linked_user_id && <Badge variant="default" className="text-[9px] px-1 py-0">Linked</Badge>}
                          {c.lifetime_value > 0 && <span className="text-[10px] text-muted-foreground">€{c.lifetime_value}</span>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-3">Name</th><th className="p-3">Stage</th><th className="p-3">Email</th><th className="p-3">LTV</th><th className="p-3">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const stage = stages.find((s) => s.stage_key === c.pipeline_stage);
                  return (
                    <tr key={c.id} onClick={() => setSelectedClient(c.id)} className="border-t border-border cursor-pointer hover:bg-secondary/30">
                      <td className="p-3 font-body text-foreground">{c.full_name}</td>
                      <td className="p-3"><Badge variant="outline" style={{ borderColor: stage?.color || undefined }}>{stage?.name || c.pipeline_stage}</Badge></td>
                      <td className="p-3 text-muted-foreground">{c.email || "—"}</td>
                      <td className="p-3 text-foreground">€{c.lifetime_value}</td>
                      <td className="p-3 text-muted-foreground text-xs">{c.last_contact_at ? format(new Date(c.last_contact_at), "MMM d") : "—"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No clients yet.</td></tr>}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <NewClientDialog open={showNew} onClose={() => setShowNew(false)} onCreated={refresh} stages={stages} />
      <ClientDetailDrawer clientId={selectedClient} open={!!selectedClient} onClose={() => setSelectedClient(null)} stages={stages} onUpdated={refresh} />
    </PortalLayout>
  );
};

export default Crm;
