import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, X, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import type { Database } from "@/integrations/supabase/types";

type PaymentType = Database["public"]["Enums"]["payment_type"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  description: string | null;
  currency: string | null;
  created_at: string;
  player_name?: string;
}

const PAYMENT_TYPES: PaymentType[] = ["camp", "monthly", "annual", "session", "other"];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "completed", "failed", "refunded"];

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-green-500/10 text-green-400",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-blue-500/10 text-blue-400",
};

const AdminPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [saving, setSaving] = useState(false);

  // Form state
  const [formUserId, setFormUserId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<PaymentType>("camp");
  const [formStatus, setFormStatus] = useState<PaymentStatus>("completed");
  const [formDesc, setFormDesc] = useState("");
  const [allUsers, setAllUsers] = useState<{ user_id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [{ data: paymentsData }, { data: usersData }] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_users"),
    ]);

    const nameMap = new Map(
      ((usersData as unknown as { user_id: string; full_name: string }[]) || []).map((u) => [u.user_id, u.full_name])
    );
    setAllUsers((usersData as unknown as { user_id: string; full_name: string }[]) || []);

    setPayments(
      ((paymentsData as Payment[]) || []).map((p) => ({
        ...p,
        player_name: nameMap.get(p.user_id) || "Unknown",
      }))
    );
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formUserId || !formAmount) return;
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      user_id: formUserId,
      amount: parseFloat(formAmount),
      type: formType,
      status: formStatus,
      description: formDesc.trim() || null,
      currency: "EUR",
    });
    if (error) { toast.error("Failed to create payment", { description: error.message }); setSaving(false); return; }
    toast.success("Payment created");
    setShowForm(false);
    setFormUserId("");
    setFormAmount("");
    setFormDesc("");
    setSaving(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: PaymentStatus) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Status → ${status}`);
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      (p.player_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filtered.reduce((sum, p) => sum + (p.status === "completed" ? Number(p.amount) : 0), 0);

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl text-foreground">PAYMENTS</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> NEW PAYMENT
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(["all", ...PAYMENT_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-2 rounded-lg font-body text-xs uppercase tracking-wider transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="font-body text-sm text-muted-foreground">
            {filtered.length} payments shown
          </p>
          <p className="font-display text-lg text-foreground">€{totalFiltered.toLocaleString()}</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
                <div className="h-6 w-20 bg-secondary rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <CreditCard size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">No payments found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-foreground">€{Number(p.amount).toFixed(2)}</span>
                    <span className="text-[10px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                      {p.type}
                    </span>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs font-body text-muted-foreground">
                    {p.player_name} · {format(new Date(p.created_at), "d MMM yyyy HH:mm")}
                  </p>
                  {p.description && (
                    <p className="text-xs font-body text-muted-foreground mt-0.5">{p.description}</p>
                  )}
                </div>
                <select
                  value={p.status}
                  onChange={(e) => updateStatus(p.id, e.target.value as PaymentStatus)}
                  className="px-2 py-1 rounded-lg bg-secondary border border-border text-foreground font-body text-xs"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </motion.div>
            ))}
          </div>
        )}

        {/* New payment modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-foreground">NEW PAYMENT</h2>
                  <button onClick={() => setShowForm(false)}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">User</label>
                    <select
                      value={formUserId}
                      onChange={(e) => setFormUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                    >
                      <option value="">Select user...</option>
                      {allUsers.map((u) => (
                        <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-body text-muted-foreground mb-1 block">Amount (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground mb-1 block">Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as PaymentType)}
                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                      >
                        {PAYMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Description (optional)</label>
                    <input
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="e.g. Beginner Camp March 2026"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!formUserId || !formAmount || saving}
                  className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "SAVING..." : "CREATE PAYMENT"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
};

export default AdminPayments;
