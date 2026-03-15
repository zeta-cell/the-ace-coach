import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Gift, Lock, ChevronRight, Copy } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import WalletCard from "@/components/portal/WalletCard";
import { LEVEL_CONFIG, LEVEL_PERKS, getNextLevel } from "@/lib/gamification";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const PARTNERS = [
  { name: "Bullpadel", code: "ACE", baseDiscount: 10 },
  { name: "Head Tennis", code: "ACE", baseDiscount: 10 },
  { name: "Wilson", code: "ACE", baseDiscount: 10 },
  { name: "ACE Merch", code: "ACE", baseDiscount: 15 },
];

const LEVEL_DISCOUNT_BONUS: Record<string, number> = {
  bronze: 0, silver: 0, gold: 5, platinum: 10, diamond: 15, legend: 20,
};

const Rewards = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
    setStats(data);
  };

  const level = stats?.current_level || "bronze";
  const lvl = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;
  const nextLevel = getNextLevel(level);
  const nextLvl = nextLevel ? LEVEL_CONFIG[nextLevel] : null;
  const xp = stats?.total_xp || 0;
  const xpToNext = nextLvl ? nextLvl.xpMin - xp : 0;
  const progress = nextLvl ? ((xp - lvl.xpMin) / (nextLvl.xpMin - lvl.xpMin)) * 100 : 100;

  const getCode = (partner: typeof PARTNERS[0]) => {
    const code = `${partner.code}${level.toUpperCase()}2026`;
    navigator.clipboard.writeText(code);
    toast.success(`Code: ${code} — copied to clipboard! Valid for 30 days.`);
  };

  const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'];
  const currentIdx = levelOrder.indexOf(level);

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl text-foreground mb-6">
          REWARDS
        </motion.h1>

        {/* Level Perks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: lvl.color + '20' }}>
              <span className="font-display text-lg" style={{ color: lvl.color }}>{lvl.label.charAt(0)}</span>
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">{lvl.label.toUpperCase()} LEVEL</h2>
              <p className="font-body text-xs text-muted-foreground">{xp} XP{nextLvl ? ` · ${xpToNext} XP to ${nextLvl.label}` : " · Max level!"}</p>
            </div>
          </div>
          {nextLvl && <Progress value={progress} className="h-2 mb-4" />}

          <div className="space-y-3">
            {levelOrder.map((l, i) => {
              const lCfg = LEVEL_CONFIG[l];
              const isUnlocked = i <= currentIdx;
              const perks = LEVEL_PERKS[l] || [];
              return (
                <div key={l} className={`rounded-lg p-3 ${isUnlocked ? "bg-secondary" : "bg-muted/30 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lCfg.color }} />
                      <span className="font-display text-xs tracking-wider text-foreground">{lCfg.label.toUpperCase()}</span>
                    </div>
                    {!isUnlocked && (
                      <span className="flex items-center gap-1 text-[9px] font-body text-muted-foreground">
                        <Lock size={10} /> {lCfg.xpMin - xp} XP away
                      </span>
                    )}
                    {isUnlocked && i === currentIdx && (
                      <span className="text-[9px] font-display text-primary tracking-wider">CURRENT</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {perks.map(p => (
                      <span key={p} className="text-[10px] font-body text-muted-foreground bg-background/50 px-2 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Partner Discounts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">PARTNER DISCOUNTS</h2>
          <div className="grid grid-cols-2 gap-3">
            {PARTNERS.map(partner => {
              const discount = partner.baseDiscount + (LEVEL_DISCOUNT_BONUS[level] || 0);
              return (
                <div key={partner.name} className="bg-card border border-border rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-display text-sm text-primary">{partner.name.charAt(0)}</span>
                  </div>
                  <p className="font-display text-sm text-foreground">{partner.name}</p>
                  <p className="font-display text-xl text-primary">{discount}% OFF</p>
                  <button onClick={() => getCode(partner)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-secondary text-foreground font-display text-[10px] tracking-wider hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1">
                    <Copy size={10} /> GET CODE
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Wallet */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WalletCard />
        </motion.div>
      </div>
    </PortalLayout>
  );
};

export default Rewards;
