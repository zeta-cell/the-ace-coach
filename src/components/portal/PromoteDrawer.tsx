import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Send, Users, Heart, Sparkles, Mail, MessageSquare, Loader2 } from "lucide-react";

export interface PromoteContent {
  headline: string;
  message: string;
  ctaUrl?: string;
  ctaLabel?: string;
  detailLines?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Prefilled content (e.g. from an event or availability announcement) */
  initial?: PromoteContent;
}

const AUDIENCES = [
  { key: "players", label: "MY PLAYERS", desc: "Everyone assigned to you", icon: Users, free: true },
  { key: "followers", label: "CLUB FOLLOWERS", desc: "Players following your clubs", icon: Heart, free: true },
] as const;

const PromoteDrawer = ({ open, onClose, initial }: Props) => {
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audiences, setAudiences] = useState<string[]>(["players"]);
  const [dm, setDm] = useState(true);
  const [email, setEmail] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHeadline(initial?.headline || "");
    setMessage(initial?.message || "");
    setCtaUrl(initial?.ctaUrl || "");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { data } = await supabase.functions.invoke("coach-promote", {
        body: { headline: "x", message: "x", audiences, dryRun: true },
      });
      if (active) setCount((data as { recipients?: number } | null)?.recipients ?? 0);
    })();
    return () => { active = false; };
  }, [open, audiences]);

  const toggleAudience = (key: string) =>
    setAudiences(prev => (prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]));

  const send = async () => {
    if (!headline.trim() || !message.trim()) { toast.error("Add a headline and a message"); return; }
    if (!dm && !email) { toast.error("Pick at least one channel"); return; }
    if (audiences.length === 0) { toast.error("Pick at least one audience"); return; }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("coach-promote", {
      body: {
        headline, message,
        ctaUrl: ctaUrl || undefined,
        ctaLabel: initial?.ctaLabel,
        detailLines: initial?.detailLines,
        audiences,
        channels: { dm, email },
      },
    });
    setSending(false);
    if (error) { toast.error("Could not send", { description: error.message }); return; }
    const r = data as { recipients: number; dm_sent: number; emails_sent: number };
    if (!r?.recipients) { toast.error("No recipients found for this audience"); return; }
    toast.success(`Sent to ${r.recipients} player${r.recipients === 1 ? "" : "s"}`, {
      description: `${r.dm_sent} direct message${r.dm_sent === 1 ? "" : "s"} · ${r.emails_sent} email${r.emails_sent === 1 ? "" : "s"}`,
    });
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-5 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg tracking-wide text-foreground">PROMOTE</h2>
            <p className="font-body text-xs text-muted-foreground">Reach your players by message & email</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Audience */}
        <p className="font-display text-[10px] tracking-widest text-muted-foreground mb-2">AUDIENCE</p>
        <div className="space-y-2 mb-5">
          {AUDIENCES.map(a => {
            const active = audiences.includes(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggleAudience(a.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <a.icon size={16} className={active ? "text-primary" : "text-muted-foreground"} />
                <span className="flex-1">
                  <span className="block font-display text-xs tracking-wider text-foreground">{a.label}</span>
                  <span className="block font-body text-[11px] text-muted-foreground">{a.desc}</span>
                </span>
                <span className="font-display text-[10px] tracking-wider text-emerald-400">FREE</span>
              </button>
            );
          })}
          <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border bg-muted/10 opacity-70">
            <Sparkles size={16} className="text-amber-400" />
            <span className="flex-1">
              <span className="block font-display text-xs tracking-wider text-foreground">BOOST TO HI VOLLEY COMMUNITY</span>
              <span className="block font-body text-[11px] text-muted-foreground">Paid reach beyond your own players</span>
            </span>
            <span className="font-display text-[10px] tracking-wider text-amber-400">SOON</span>
          </div>
        </div>

        {count !== null && (
          <p className="font-body text-xs text-muted-foreground mb-5">
            <span className="text-foreground font-display">{count}</span> recipient{count === 1 ? "" : "s"} selected
          </p>
        )}

        {/* Channels */}
        <p className="font-display text-[10px] tracking-widest text-muted-foreground mb-2">CHANNELS</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {([
            { on: dm, set: setDm, icon: MessageSquare, label: "DIRECT MESSAGE" },
            { on: email, set: setEmail, icon: Mail, label: "EMAIL" },
          ] as const).map(c => (
            <button
              key={c.label}
              onClick={() => c.set(!c.on)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                c.on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              <c.icon size={14} />
              <span className="font-display text-[10px] tracking-wider">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="font-display text-[10px] tracking-widest text-muted-foreground">HEADLINE</label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              maxLength={120}
              placeholder="Padel clinic — Saturday 10:00"
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted/30 border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-display text-[10px] tracking-widest text-muted-foreground">MESSAGE</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Two spots left — bring water and your best smash."
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted/30 border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="font-display text-[10px] tracking-widest text-muted-foreground">LINK</label>
            <input
              value={ctaUrl}
              onChange={e => setCtaUrl(e.target.value)}
              placeholder="https://hivolley.com/events"
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-muted/30 border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={send}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-widest disabled:opacity-60"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "SENDING..." : "SEND ANNOUNCEMENT"}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default PromoteDrawer;
