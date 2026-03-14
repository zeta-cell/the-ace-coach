import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Search } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface Contact {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_message?: string;
  last_at?: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM");
};

const Messages = () => {
  const { user, role } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollRef = useRef<HTMLDivElement>(null);

  // FIX 1: proper resize listener
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fetch contacts based on role
  useEffect(() => {
    if (user) fetchContacts();
  }, [user, role]);

  const fetchContacts = async () => {
    if (!user) return;
    let contactIds: string[] = [];

    if (role === "coach") {
      const { data } = await supabase
        .from("coach_player_assignments")
        .select("player_id")
        .eq("coach_id", user.id);
      contactIds = data?.map((a) => a.player_id) || [];
    } else {
      const { data } = await supabase
        .from("coach_player_assignments")
        .select("coach_id")
        .eq("player_id", user.id);
      contactIds = data?.map((a) => a.coach_id) || [];
    }

    if (contactIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", contactIds);

    const contactList: Contact[] = [];
    for (const p of profiles || []) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.user_id}),and(sender_id.eq.${p.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", p.user_id)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      contactList.push({
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        last_message: lastMsg?.content,
        last_at: lastMsg?.created_at,
        unread: count || 0,
      });
    }

    contactList.sort((a, b) => {
      if (!a.last_at && !b.last_at) return 0;
      if (!a.last_at) return 1;
      if (!b.last_at) return -1;
      return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
    });

    setContacts(contactList);
    setLoading(false);
  };

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!user || !activeContact) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${activeContact.user_id}),and(sender_id.eq.${activeContact.user_id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);

    // Mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", activeContact.user_id)
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    // FIX 3: clear unread badge on contact
    setContacts((prev) =>
      prev.map((c) =>
        c.user_id === activeContact.user_id ? { ...c, unread: 0 } : c
      )
    );
  }, [user, activeContact]);

  useEffect(() => {
    if (activeContact) fetchMessages();
  }, [activeContact, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !activeContact) return;
    const channel = supabase
      .channel(`chat-${activeContact.user_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === activeContact.user_id) ||
            (msg.sender_id === activeContact.user_id && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_id === activeContact.user_id) {
              supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeContact]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !activeContact || !draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeContact.user_id,
      content,
    });

    await supabase.from("notifications").insert({
      user_id: activeContact.user_id,
      title: "New message",
      body: content.substring(0, 100),
      link: "/messages",
    });
  };

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-0 md:gap-4">
        {/* Contact list — FIX 1: use isMobile state */}
        <AnimatePresence mode="wait">
          {(!activeContact || !isMobile) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${activeContact ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 shrink-0`}
            >
              <h1 className="font-display text-2xl text-foreground mb-3">MESSAGES</h1>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
                  <p className="font-body text-sm text-muted-foreground">
                    {contacts.length === 0
                      ? role === "player"
                        ? "No coach assigned yet."
                        : "No players assigned yet."
                      : "No matches."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto flex-1">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.user_id}
                      onClick={() => setActiveContact(c)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        activeContact?.user_id === c.user_id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-card border border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm shrink-0">
                        {c.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm text-foreground truncate">{c.full_name}</span>
                          {c.last_at && (
                            <span className="text-[10px] font-body text-muted-foreground shrink-0 ml-2">
                              {formatTime(c.last_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-body text-muted-foreground truncate">
                            {c.last_message || "No messages yet"}
                          </p>
                          {c.unread > 0 && (
                            <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-body font-bold flex items-center justify-center">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        {activeContact ? (
          <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <button
                onClick={() => setActiveContact(null)}
                className="md:hidden p-1 rounded-lg hover:bg-secondary"
              >
                <ArrowLeft size={18} className="text-muted-foreground" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">
                {activeContact.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="font-display text-foreground">{activeContact.full_name}</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground font-body text-sm py-8">
                  Start the conversation...
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl font-body text-sm whitespace-pre-wrap ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FIX 2: textarea with shift+enter support */}
            <div className="border-t border-border p-3 flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                style={{ maxHeight: "120px", overflowY: "auto" }}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-card border border-border rounded-xl">
            <p className="font-body text-muted-foreground text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Messages;
