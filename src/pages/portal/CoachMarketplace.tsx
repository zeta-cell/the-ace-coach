import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ShoppingBag, Star, ChevronRight, BarChart3, DollarSign, TrendingUp, Eye, EyeOff, Share, Layers } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import { toast } from "sonner";

interface PublishedBlock {
  id: string;
  title: string;
  block_type: string;
  is_public: boolean;
  is_for_sale: boolean;
  price: number;
  times_used: number;
  rating_avg: number;
  rating_count: number;
  category: string;
  sport: string;
  sales_count?: number;
  revenue?: number;
}

const CoachMarketplace = () => {
  const { user, role } = useAuth();
  const [blocks, setBlocks] = useState<PublishedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"published" | "drafts">("published");
  const [stats, setStats] = useState({ published: 0, totalSales: 0, totalRevenue: 0 });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: myBlocks } = await supabase
      .from("training_blocks").select("*")
      .eq("coach_id", user.id).eq("is_system", false)
      .order("created_at", { ascending: false });

    const { data: sales } = await supabase
      .from("block_purchases").select("block_id, amount_paid, platform_fee")
      .eq("seller_id", user.id);

    const salesMap = new Map<string, { count: number; revenue: number }>();
    let totalRevenue = 0;
    sales?.forEach((s) => {
      const existing = salesMap.get(s.block_id) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += (Number(s.amount_paid) - Number(s.platform_fee || 0));
      totalRevenue += (Number(s.amount_paid) - Number(s.platform_fee || 0));
      salesMap.set(s.block_id, existing);
    });

    const result = (myBlocks || []).map((b: any) => ({
      ...b,
      sales_count: salesMap.get(b.id)?.count || 0,
      revenue: salesMap.get(b.id)?.revenue || 0,
    }));

    setBlocks(result);
    setStats({
      published: result.filter((b: any) => b.is_public).length,
      totalSales: sales?.length || 0,
      totalRevenue,
    });
    setLoading(false);
  };

  const togglePublish = async (block: PublishedBlock) => {
    await supabase.from("training_blocks").update({ is_public: !block.is_public } as any).eq("id", block.id);
    toast.success(block.is_public ? "Unpublished" : "Published to marketplace!");
    fetchData();
  };

  const copyShareLink = (blockId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/marketplace?block=${blockId}`);
    toast.success("Link copied!");
  };

  const filteredBlocks = blocks.filter((b) =>
    tab === "published" ? b.is_public : !b.is_public
  );

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl md:text-3xl text-foreground mb-6 tracking-wider">
          MY PROGRAMS & BLOCKS
        </motion.h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Layers size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.published}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Published</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <ShoppingBag size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.totalSales}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Total Sales</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <DollarSign size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">€{stats.totalRevenue.toFixed(0)}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-6">
          {(["published", "drafts"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>{t.toUpperCase()}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : filteredBlocks.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              {tab === "published" ? "No published programs yet." : "No draft programs."}
            </p>
            <Link to="/coach/calendar" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90">
              CREATE A PROGRAM
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBlocks.map((block) => (
              <div key={block.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-sm text-foreground truncate">{block.title}</h3>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-display bg-secondary text-muted-foreground">{block.block_type?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-body text-muted-foreground">
                    {tab === "published" && (
                      <>
                        <span>€{block.revenue?.toFixed(0) || 0} from {block.sales_count || 0} sales</span>
                        <span>·</span>
                      </>
                    )}
                    {(block.rating_count || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        {(block.rating_avg || 0).toFixed(1)} ({block.rating_count})
                      </span>
                    )}
                    <span>Used {block.times_used || 0}×</span>
                    {block.is_for_sale && <span className="text-primary">€{block.price}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tab === "published" ? (
                    <>
                      <button onClick={() => copyShareLink(block.id)}
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors" title="Share">
                        <Share size={14} />
                      </button>
                      <button onClick={() => togglePublish(block)}
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors" title="Unpublish">
                        <EyeOff size={14} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => togglePublish(block)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90">
                      PUBLISH NOW
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default CoachMarketplace;
