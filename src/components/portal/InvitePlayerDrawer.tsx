import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { X, Copy, Link2, Check, Clock, Mail } from "lucide-react";

interface InviteRow {
  id: string;
  full_name: string | null;
  email: string | null;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

/** Coach-side drawer: create a one-click invite link for a player. */
const InvitePlayerDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_invites")
      .select("id, full_name, email, token, accepted_at, expires_at, created_at")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setInvites((data || []) as InviteRow[]);
  };

  useEffect(() => {
    if (open) load();
  }, [open, user]);

  const create = async () => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("coach_invites")
      .insert({ coach_id: user.id, full_name: name || null, email: email || null })
      .select("token")
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setEmail("");
    await load();
    await copy(data!.token);
    toast.success("Invite link created and copied");
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Copy failed — select the link manually");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-h-[88vh] overflow-y-auto"
          >
            <div className="max-w-lg mx-auto p-5 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl text-foreground tracking-wide">INVITE A PLAYER</h2>
                <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
              </div>

              <p className="font-body text-sm text-muted-foreground mb-4">
                Send this link to your player. They only pick an email + password (or Google / Apple) and are linked to you automatically — then they see their assessment.
              </p>

              <div className="space-y-3 mb-4">
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Player name (optional)"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Player email (optional, pre-fills the form)"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                onClick={create} disabled={busy}
                className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Link2 size={16} /> {busy ? "CREATING…" : "CREATE INVITE LINK"}
              </button>

              {invites.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="font-display text-xs tracking-wider text-muted-foreground">RECENT INVITES</p>
                  {invites.map((i) => (
                    <div key={i.id} className="bg-background border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-body text-sm text-foreground truncate">{i.full_name || i.email || "Player invite"}</p>
                          <p className="font-body text-xs text-muted-foreground truncate">{inviteUrl(i.token)}</p>
                        </div>
                        <button
                          onClick={() => copy(i.token)}
                          className="shrink-0 h-9 w-9 rounded-lg bg-secondary flex items-center justify-center text-foreground"
                          aria-label="Copy invite link"
                        >
                          {copied === i.token ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {i.accepted_at ? (
                          <span className="inline-flex items-center gap-1 font-body text-xs text-primary"><Check size={12} /> Accepted</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground"><Clock size={12} /> Pending</span>
                        )}
                        {i.email && (
                          <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground"><Mail size={12} /> {i.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvitePlayerDrawer;
