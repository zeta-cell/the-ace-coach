import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  X, ArrowLeft, Search, CheckCircle, Send, CalendarDays, BookOpen,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CoachOption {
  user_id: string; full_name: string; avatar_url: string | null;
  badge_level: string; is_verified: boolean; bio: string | null;
  location_city: string | null; languages: string[]; hourly_rate_from: number | null;
  response_time_hours: number; profile_slug: string | null;
  avg_rating: number; review_count: number;
}

interface CoachPackage {
  id: string; title: string; session_type: string; duration_minutes: number;
  price_per_session: number; currency: string; sport: string;
}

interface MarketplaceBlock {
  id: string; title: string; week_count: number; author_id: string | null;
  [key: string]: any;
}

interface Props {
  block: MarketplaceBlock;
  coachProfile: CoachOption | null;
  onClose: () => void;
  onBack: () => void;
}

const REQUEST_TYPES = [
  { key: "guide_program" as const, label: "GUIDE MY PROGRAM", sub: "Coach gets full access to your weekly schedule" },
  { key: "book_session" as const, label: "BOOK SESSIONS ALONGSIDE", sub: "Add 1:1 sessions to complement the program" },
  { key: "full_coaching" as const, label: "FULL COACHING", sub: "Coach customises and leads everything" },
];

const BlockAssignCoachFlow = ({ block, coachProfile, onClose, onBack }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCoach, setSelectedCoach] = useState<CoachOption | null>(null);
  const [coachSearch, setCoachSearch] = useState("");
  const [allCoaches, setAllCoaches] = useState<CoachOption[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [coachPackages, setCoachPackages] = useState<CoachPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<"guide_program" | "book_session" | "full_coaching">("guide_program");
  const [proposedDate, setProposedDate] = useState<Date | undefined>(undefined);
  const [proposedSessions, setProposedSessions] = useState(1);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [coachesFetched, setCoachesFetched] = useState(false);

  const fetchAllCoaches = async () => {
    if (coachesFetched) return;
    setLoadingCoaches(true);
    const { data: coaches } = await supabase.from("coach_profiles").select("user_id, badge_level, is_verified, bio, location_city, languages, hourly_rate_from, response_time_hours, profile_slug");
    if (!coaches) { setLoadingCoaches(false); return; }
    const uids = coaches.map((c) => c.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", uids);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    setAllCoaches(coaches.map((c) => ({
      ...c, full_name: profileMap.get(c.user_id)?.full_name || "", avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
      avg_rating: 0, review_count: 0,
    })));
    setLoadingCoaches(false);
    setCoachesFetched(true);
  };

  const selectCoach = async (coach: CoachOption) => {
    setSelectedCoach(coach);
    const { data } = await supabase.from("coach_packages").select("*").eq("coach_id", coach.user_id).eq("is_active", true);
    setCoachPackages((data as unknown as CoachPackage[]) || []);
    const name = coach.full_name.split(" ")[0];
    if (requestType === "guide_program") {
      setRequestMessage(`Hi ${name}, I've purchased "${block.title}" and would love your guidance executing it.`);
    } else if (requestType === "book_session") {
      setRequestMessage(`Hi ${name}, I'd like to book sessions alongside the "${block.title}" program.`);
    } else {
      setRequestMessage(`Hi ${name}, I'm looking for a full-time coach and just bought "${block.title}" to show the kind of training I want.`);
    }
    setStep(2);
  };

  const handleSendRequest = async () => {
    if (!user || !selectedCoach || !block) return;
    setSendingRequest(true);
    await supabase.from("coach_requests").insert({
      player_id: user.id, coach_id: selectedCoach.user_id, block_id: block.id,
      request_type: requestType, message: requestMessage,
      package_id: selectedPackage || null,
      proposed_start_date: proposedDate ? format(proposedDate, "yyyy-MM-dd") : null,
      proposed_sessions: requestType === "book_session" ? proposedSessions : 1,
    });
    setSendingRequest(false);
    setStep(3);
  };

  // Fetch coaches when component mounts
  useState(() => { fetchAllCoaches(); });

  const filteredCoaches = allCoaches.filter((c) =>
    !coachSearch.trim() || c.full_name.toLowerCase().includes(coachSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        {step < 3 && (
          <button onClick={() => step === 1 ? onBack() : setStep(1)} className="p-1.5 rounded-lg hover:bg-secondary">
            <ArrowLeft size={16} />
          </button>
        )}
        <h3 className="font-display text-sm text-foreground flex-1">
          {step === 1 ? "CHOOSE A COACH" : step === 2 ? "CONFIGURE REQUEST" : "REQUEST SENT!"}
        </h3>
        <button onClick={onClose}><X size={16} className="text-muted-foreground" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            {coachProfile && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="font-display text-[10px] tracking-wider text-muted-foreground">THE PROGRAM AUTHOR</p>
                <div className="flex items-center gap-3">
                  {coachProfile.avatar_url ? <img src={coachProfile.avatar_url} className="w-12 h-12 rounded-full border-2 border-border" /> : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display">{coachProfile.full_name?.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-sm text-foreground truncate">{coachProfile.full_name}</p>
                      {coachProfile.is_verified && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground">
                      <span className="capitalize">{coachProfile.badge_level}</span>
                      {coachProfile.location_city && <><span>·</span><span>{coachProfile.location_city}</span></>}
                      {coachProfile.hourly_rate_from && <><span>·</span><span className="text-primary">From €{coachProfile.hourly_rate_from}/session</span></>}
                    </div>
                  </div>
                </div>
                {coachProfile.bio && <p className="text-xs font-body text-muted-foreground line-clamp-2">{coachProfile.bio}</p>}
                <button onClick={() => selectCoach(coachProfile)}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 transition-colors">
                  SELECT THIS COACH
                </button>
              </div>
            )}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"><Search size={20} className="text-muted-foreground" /></div>
                <div>
                  <p className="font-display text-xs text-foreground">FIND ANY COACH</p>
                  <p className="text-[10px] font-body text-muted-foreground">Any coach gets instant access to this program's full structure</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input value={coachSearch} onChange={(e) => setCoachSearch(e.target.value)}
                  placeholder="Search coaches..." className="flex-1 bg-transparent text-sm font-body text-foreground focus:outline-none" />
              </div>
              {loadingCoaches ? (
                <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {filteredCoaches.map((c) => (
                    <div key={c.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors">
                      {c.avatar_url ? <img src={c.avatar_url} className="w-9 h-9 rounded-full border border-border" /> : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">{c.full_name?.charAt(0)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-body text-foreground truncate">{c.full_name}</span>
                          {c.is_verified && <CheckCircle size={10} className="text-blue-400 shrink-0" />}
                        </div>
                        <span className="text-[9px] font-body text-muted-foreground capitalize">{c.badge_level}{c.hourly_rate_from ? ` · €${c.hourly_rate_from}` : ""}</span>
                      </div>
                      <button onClick={() => selectCoach(c)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider shrink-0">
                        SELECT
                      </button>
                    </div>
                  ))}
                  {filteredCoaches.length === 0 && <p className="text-xs font-body text-muted-foreground text-center py-4">No coaches found</p>}
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedCoach && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              {selectedCoach.avatar_url ? <img src={selectedCoach.avatar_url} className="w-10 h-10 rounded-full border border-border" /> : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">{selectedCoach.full_name?.charAt(0)}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-foreground truncate">{selectedCoach.full_name}</p>
                <p className="text-[9px] font-body text-muted-foreground capitalize">{selectedCoach.badge_level}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-[9px] font-display text-primary">CHANGE</button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <BookOpen size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body text-foreground truncate">{block.title}</p>
                {block.week_count > 1 && <p className="text-[9px] font-body text-muted-foreground">{block.week_count}-week program</p>}
              </div>
            </div>

            <div>
              <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">REQUEST TYPE</p>
              <div className="space-y-1.5">
                {REQUEST_TYPES.map((rt) => (
                  <button key={rt.key} onClick={() => setRequestType(rt.key)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${requestType === rt.key ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                    <p className="font-display text-[10px] tracking-wider text-foreground">{rt.label}</p>
                    <p className="text-[9px] font-body text-muted-foreground">{rt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {coachPackages.length > 0 && (
              <div>
                <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">SELECT PACKAGE</p>
                <div className="space-y-1.5">
                  {coachPackages.map((pkg) => (
                    <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedPackage === pkg.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-body text-foreground">{pkg.title}</span>
                        <span className="text-xs font-display text-primary">€{pkg.price_per_session}</span>
                      </div>
                      <p className="text-[9px] font-body text-muted-foreground capitalize">{pkg.session_type} · {pkg.duration_minutes}min · {pkg.sport}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {coachPackages.length === 0 && (
              <p className="text-[10px] font-body text-muted-foreground p-3 rounded-xl bg-secondary">This coach hasn't set up packages yet — send a free request</p>
            )}

            <div>
              <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">PROPOSED START DATE</p>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full px-3 py-2.5 rounded-xl border border-border text-left font-body text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    {proposedDate ? format(proposedDate, "PPP") : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={proposedDate} onSelect={setProposedDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            {requestType === "book_session" && (
              <div>
                <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-1">NUMBER OF SESSIONS</p>
                <input type="number" value={proposedSessions} onChange={(e) => setProposedSessions(Number(e.target.value))} min={1}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none" />
              </div>
            )}

            <div>
              <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-1">MESSAGE TO COACH</p>
              <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none" />
            </div>

            <button onClick={handleSendRequest} disabled={sendingRequest}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Send size={14} /> {sendingRequest ? "SENDING..." : "SEND REQUEST"}
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && selectedCoach && (
          <div className="text-center py-8 space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-400" />
              </div>
            </motion.div>
            <div>
              <h3 className="font-display text-lg text-foreground mb-1">Request sent to {selectedCoach.full_name}!</h3>
              <p className="text-xs font-body text-muted-foreground">They typically respond within {selectedCoach.response_time_hours || 24} hours</p>
            </div>
            <div className="text-left space-y-2 bg-secondary rounded-xl p-4">
              <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">WHAT HAPPENS NEXT</p>
              {["Coach reviews your request and program", "Coach accepts and you get notified", "Your program plan is shared with the coach", "Coach can add notes, adjust timing and book sessions"].map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs font-body text-foreground">{s}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Link to="/dashboard" onClick={onClose} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-display text-[10px] tracking-wider text-center hover:bg-primary/90">VIEW MY PROGRAMS</Link>
              <Link to="/marketplace" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-display text-[10px] tracking-wider text-foreground text-center hover:bg-secondary">BROWSE MORE</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockAssignCoachFlow;
