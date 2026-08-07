import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Send, Megaphone, Loader2, MessageCircle } from "lucide-react";

export interface ThreadMessage {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  is_coach: boolean;
  content: string;
  attachment_url: string | null;
  is_announcement: boolean;
  created_at: string;
}

interface Props {
  eventId: string;
  canManage: boolean;
  canPost: boolean;
}

const ClassChat = ({ eventId, canManage, canPost }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_class_thread", { _event_id: eventId });
    setMessages((data || []) as ThreadMessage[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`class-thread-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_messages", filter: `event_id=eq.${eventId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, load]);

  const send = async () => {
    if (!user || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.from("event_messages").insert({
      event_id: eventId,
      author_id: user.id,
      content: draft.trim().slice(0, 2000),
      is_announcement: canManage && asAnnouncement,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft("");
    setAsAnnouncement(false);
    load();
  };

  const announcements = messages.filter((m) => m.is_announcement);
  const thread = messages.filter((m) => !m.is_announcement);

  return (
    <div className="space-y-4">
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.slice(-3).map((m) => (
            <div key={m.id} className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <Megaphone size={13} className="text-primary" />
                <span className="font-display text-[10px] tracking-wider text-primary">ANNOUNCEMENT · {m.author_name.toUpperCase()}</span>
              </div>
              <p className="whitespace-pre-wrap font-body text-sm text-foreground">{m.content}</p>
              <p className="mt-1 font-body text-[10px] text-muted-foreground">{format(new Date(m.created_at), "d MMM, HH:mm")}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/60">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <MessageCircle size={14} className="text-primary" />
          <span className="font-display text-[11px] tracking-wider text-foreground">GROUP CHAT</span>
          <span className="ml-auto font-body text-[11px] text-muted-foreground">{thread.length} messages</span>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
          ) : thread.length === 0 ? (
            <p className="py-4 text-center font-body text-sm text-muted-foreground">No messages yet — say hi to the group.</p>
          ) : (
            thread.map((m) => {
              const mine = m.author_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                  {m.author_avatar ? (
                    <img src={m.author_avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary font-display text-[10px] text-muted-foreground">
                      {m.author_name.charAt(0)}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    <p className="mb-0.5 font-display text-[9px] tracking-wider opacity-70">
                      {m.author_name.toUpperCase()}{m.is_coach ? " · COACH" : ""}
                    </p>
                    <p className="whitespace-pre-wrap font-body text-sm">{m.content}</p>
                    <p className="mt-0.5 font-body text-[10px] opacity-60">{format(new Date(m.created_at), "d MMM, HH:mm")}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {canPost ? (
          <div className="space-y-2 border-t border-border p-3">
            {canManage && (
              <button
                onClick={() => setAsAnnouncement((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] tracking-wider ${asAnnouncement ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                <Megaphone size={11} /> {asAnnouncement ? "SENDING AS ANNOUNCEMENT" : "SEND AS ANNOUNCEMENT"}
              </button>
            )}
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message the group…"
                className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={send} disabled={sending || !draft.trim()}
                className="grid w-11 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        ) : (
          <p className="border-t border-border p-3 text-center font-body text-xs text-muted-foreground">
            Join the class to chat with the group.
          </p>
        )}
      </div>
    </div>
  );
};

export default ClassChat;
