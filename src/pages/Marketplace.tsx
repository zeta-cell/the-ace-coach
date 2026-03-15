import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Star, CheckCircle, Shield, Zap, Crown,
  ShoppingBag, Heart, BookOpen, Brain, Dumbbell, Play,
  Clock, Users, ChevronRight, X, Award, Target,
} from "lucide-react";
import BlockDetailDrawer from "@/components/portal/BlockDetailDrawer";

/* ── types ── */
interface MarketplaceBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  sport: string;
  duration_minutes: number;
  difficulty: string;
  goals: string[];
  exercises: any[];
  is_system: boolean;
  is_public: boolean;
  is_for_sale: boolean;
  price: number;
  currency: string;
  block_type: string;
  week_count: number;
  times_used: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  thumbnail_url: string | null;
  preview_exercises: any;
  weekly_structure: any;
  target_level: string | null;
  target_sport: string;
  author_id: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  coach_id: string | null;
}

const BLOCK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  session: { label: "SESSION", color: "bg-cyan-500/20 text-cyan-400" },
  week: { label: "WEEK PLAN", color: "bg-blue-500/20 text-blue-400" },
  program: { label: "PROGRAM", color: "bg-purple-500/20 text-purple-400" },
  nutrition: { label: "NUTRITION", color: "bg-lime-500/20 text-lime-400" },
  mental: { label: "MENTAL", color: "bg-pink-500/20 text-pink-400" },
  template: { label: "TEMPLATE", color: "bg-muted text-muted-foreground" },
};

const BLOCK_TYPE_FILTERS = ["All", "program", "session", "nutrition", "mental", "template"];
const SPORT_FILTERS = ["All", "Tennis", "Padel"];
const LEVEL_FILTERS = ["All", "Beginner", "Intermediate", "Advanced", "Elite"];
const SORT_OPTIONS = [
  { key: "popular", label: "Most Popular" },
  { key: "rated", label: "Highest Rated" },
  { key: "newest", label: "Newest" },
  { key: "price_low", label: "Price: Low" },
  { key: "price_high", label: "Price: High" },
  { key: "free", label: "Free First" },
];

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [blocks, setBlocks] = useState<MarketplaceBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sportFilter, setSportFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedBlock, setSelectedBlock] = useState<MarketplaceBlock | null>(null);

  useEffect(() => { fetchBlocks(); }, []);
  useEffect(() => { if (user) fetchUserData(); }, [user]);

  const fetchBlocks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("training_blocks")
      .select("*")
      .eq("is_public", true)
      .order("times_used", { ascending: false });
    setBlocks((data as any as MarketplaceBlock[]) || []);
    setLoading(false);
  };

  const fetchUserData = async () => {
    if (!user) return;
    const [purchasesRes, savesRes] = await Promise.all([
      supabase.from("block_purchases").select("block_id").eq("buyer_id", user.id),
      supabase.from("block_saves").select("block_id").eq("saved_by", user.id),
    ]);
    setOwnedIds(new Set(purchasesRes.data?.map((p) => p.block_id) || []));
    setSavedIds(new Set(savesRes.data?.map((s) => s.block_id) || []));
  };

  const handleGetProgram = async (block: MarketplaceBlock) => {
    if (!user) { navigate("/login?redirect=/marketplace"); return; }
    if (block.is_for_sale && block.price > 0) {
      // Paid — coming soon
      await supabase.from("block_saves").upsert({ block_id: block.id, saved_by: user.id } as any, { onConflict: "block_id,saved_by" });
      setSavedIds((prev) => new Set([...prev, block.id]));
      toast.success("Added to your wishlist ♥ Payment coming soon!");
      return;
    }
    // Free — purchase immediately
    const { error } = await supabase.from("block_purchases").insert({
      block_id: block.id, buyer_id: user.id,
      seller_id: block.author_id || block.coach_id,
      amount_paid: 0, currency: block.currency || "EUR", platform_fee: 0, status: "completed",
    } as any);
    if (error && error.code !== "23505") { toast.error("Failed to get program"); return; }
    await supabase.rpc("increment_block_usage", { p_block_id: block.id });
    setOwnedIds((prev) => new Set([...prev, block.id]));
    toast.success("Program added to your library! Go to Dashboard → My Programs");
  };

  const toggleSave = async (block: MarketplaceBlock) => {
    if (!user) { navigate("/login?redirect=/marketplace"); return; }
    if (savedIds.has(block.id)) {
      await supabase.from("block_saves").delete().eq("block_id", block.id).eq("saved_by", user.id);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(block.id); return n; });
    } else {
      await supabase.from("block_saves").insert({ block_id: block.id, saved_by: user.id } as any);
      setSavedIds((prev) => new Set([...prev, block.id]));
    }
  };

  const filtered = useMemo(() => {
    let result = [...blocks];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.author_name?.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== "All") result = result.filter((b) => b.block_type === typeFilter);
    if (sportFilter !== "All") result = result.filter((b) => b.target_sport === sportFilter.toLowerCase() || b.target_sport === "both" || b.sport === sportFilter.toLowerCase() || b.sport === "both");
    if (levelFilter !== "All") result = result.filter((b) => b.target_level?.toLowerCase() === levelFilter.toLowerCase() || b.difficulty?.toLowerCase() === levelFilter.toLowerCase());

    switch (sortBy) {
      case "rated": result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0)); break;
      case "newest": result.sort((a, b) => b.id.localeCompare(a.id)); break;
      case "price_low": result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price_high": result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "free": result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      default: result.sort((a, b) => (b.times_used || 0) - (a.times_used || 0));
    }
    return result;
  }, [blocks, search, typeFilter, sportFilter, levelFilter, sortBy]);

  const featured = useMemo(() => blocks.filter((b) => (b.rating_avg || 0) >= 4.5 && (b.times_used || 0) >= 5), [blocks]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="font-display text-2xl tracking-wider text-foreground shrink-0">ACE<span className="text-primary">.</span></Link>
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <Link to="/find-a-coach" className="font-display text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">FIND A COACH</Link>
            <Link to="/marketplace?type=program" className="font-display text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">PROGRAMS</Link>
            <Link to="/marketplace" className="font-display text-xs tracking-wider text-primary">MARKETPLACE</Link>
            <Link to="/events" className="font-display text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">EVENTS</Link>
            <Link to="/community" className="font-display text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">COMMUNITY</Link>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link to="/login" className="font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">LOG IN</Link>
            <Link to="/login" className="font-display text-sm tracking-wider bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors">SIGN UP</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-card border-b border-border py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3 relative">COACHING KNOWLEDGE MARKETPLACE</h1>
        <p className="font-body text-sm md:text-base text-muted-foreground max-w-2xl mx-auto relative">
          Buy elite training programs from the world's best coaches. Insert directly into your training plan.
        </p>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-card border border-border rounded-xl px-3 py-2 max-w-md">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs, coaches, methods..."
                className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 font-body text-sm text-foreground focus:outline-none hidden md:block">
              {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 shrink-0">
              {BLOCK_TYPE_FILTERS.map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider whitespace-nowrap transition-colors ${
                    typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>{t === "All" ? "ALL" : t.toUpperCase()}</button>
              ))}
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              {SPORT_FILTERS.map((s) => (
                <button key={s} onClick={() => setSportFilter(s)}
                  className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                    sportFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>{s.toUpperCase()}</button>
              ))}
            </div>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              {LEVEL_FILTERS.map((l) => (
                <button key={l} onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                    levelFilter === l ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Featured section */}
        {featured.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-lg tracking-wider text-foreground mb-4">FEATURED PROGRAMS</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {featured.map((block) => (
                <div key={block.id} onClick={() => setSelectedBlock(block)}
                  className="min-w-[300px] bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all group">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-4">
                    <div className="flex items-center gap-2">
                      {block.author_avatar_url ? (
                        <img src={block.author_avatar_url} className="w-8 h-8 rounded-full border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">{block.author_name?.charAt(0) || "C"}</div>
                      )}
                      <span className="text-xs font-body text-foreground">{block.author_name || "ACE Coach"}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm text-foreground mb-1 line-clamp-1">{block.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-body text-foreground">{(block.rating_avg || 0).toFixed(1)}</span>
                      <span className="text-[10px] font-body text-muted-foreground">({block.rating_count})</span>
                    </div>
                    <span className="font-display text-sm text-primary">
                      {block.price > 0 ? `€${block.price}` : "FREE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-28 bg-muted rounded-xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && filtered.length > 0 && (
          <>
            <p className="font-display text-xs tracking-wider text-muted-foreground mb-4">
              {filtered.length} PROGRAM{filtered.length !== 1 ? "S" : ""} FOUND
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((block) => {
                const typeConfig = BLOCK_TYPE_LABELS[block.block_type] || BLOCK_TYPE_LABELS.session;
                const isOwned = ownedIds.has(block.id);
                const isSaved = savedIds.has(block.id);
                return (
                  <motion.div key={block.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all group">
                    {/* Thumbnail */}
                    <div className="relative h-28 bg-gradient-to-br from-primary/15 to-accent/5 p-3 flex flex-col justify-between cursor-pointer"
                      onClick={() => setSelectedBlock(block)}>
                      <div className="flex items-start justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-display tracking-wider ${typeConfig.color}`}>{typeConfig.label}</span>
                        <span className={`px-2 py-0.5 rounded font-display text-[10px] ${
                          block.price > 0 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                        }`}>
                          {block.price > 0 ? `€${block.price}` : "FREE"}
                        </span>
                      </div>
                      {isOwned && (
                        <span className="absolute top-3 right-14 px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-display text-[9px]">OWNED</span>
                      )}
                      <div className="flex items-center gap-2">
                        {block.author_avatar_url ? (
                          <img src={block.author_avatar_url} className="w-6 h-6 rounded-full border border-border" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-primary font-display text-[9px]">{block.author_name?.charAt(0) || "C"}</div>
                        )}
                        <span className="text-[10px] font-body text-foreground">{block.author_name || "ACE System"}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-display text-sm text-foreground line-clamp-2 cursor-pointer" onClick={() => setSelectedBlock(block)}>
                        {block.title}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        {block.target_sport && block.target_sport !== "both" && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-[8px] font-display text-muted-foreground">{block.target_sport.toUpperCase()}</span>
                        )}
                        {(block.target_level || block.difficulty) && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-[8px] font-display text-muted-foreground">{(block.target_level || block.difficulty || "").toUpperCase()}</span>
                        )}
                        {block.block_type === "program" && block.week_count > 1 && (
                          <span className="text-[9px] font-body text-primary">{block.week_count}-week program</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {(block.rating_count || 0) > 0 ? (
                          <>
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs font-body text-foreground">{(block.rating_avg || 0).toFixed(1)}</span>
                            <span className="text-[9px] font-body text-muted-foreground">({block.rating_count})</span>
                          </>
                        ) : (
                          <span className="text-[9px] font-body text-muted-foreground">No ratings yet</span>
                        )}
                        <span className="text-[9px] font-body text-muted-foreground ml-auto">Used by {block.times_used || 0}</span>
                      </div>

                      {block.tags && block.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {(block.tags as string[]).slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-[8px] font-body text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}

                      {block.description && (
                        <p className="text-[10px] font-body text-muted-foreground line-clamp-2">{block.description}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setSelectedBlock(block)}
                          className="flex-1 py-2 rounded-xl border border-border font-display text-[10px] tracking-wider text-foreground hover:bg-secondary transition-colors">
                          PREVIEW
                        </button>
                        {isOwned ? (
                          <Link to="/dashboard"
                            className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 font-display text-[10px] tracking-wider text-center hover:bg-green-500/30 transition-colors">
                            GO TO PLAN
                          </Link>
                        ) : (
                          <button onClick={() => handleGetProgram(block)}
                            className="flex-1 py-2 rounded-xl bg-primary font-display text-[10px] tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors">
                            {block.price > 0 ? `BUY — €${block.price}` : "GET PROGRAM"}
                          </button>
                        )}
                        <button onClick={() => toggleSave(block)}
                          className={`p-2 rounded-xl border transition-colors ${isSaved ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                          <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag size={40} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">NO PROGRAMS YET</h3>
            <p className="font-body text-sm text-muted-foreground">Be the first to publish your coaching knowledge.</p>
          </div>
        )}
      </div>

      {/* Block detail drawer */}
      <BlockDetailDrawer
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        isOwned={selectedBlock ? ownedIds.has(selectedBlock.id) : false}
        onGetProgram={handleGetProgram}
        onToggleSave={toggleSave}
        isSaved={selectedBlock ? savedIds.has(selectedBlock.id) : false}
      />
    </div>
  );
};

export default Marketplace;
