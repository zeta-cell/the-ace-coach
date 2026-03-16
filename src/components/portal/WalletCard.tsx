import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Copy, ArrowUpRight, ArrowDownLeft, Share2, MessageCircle, Coins } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number;
  created_at: string;
}

interface ReferralStats {
  total: number;
  signedUp: number;
  booked: number;
  earned: number;
}

const WalletCard = () => {
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats>({ total: 0, signedUp: 0, booked: 0, earned: 0 });
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchReferrals();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    const { data: stats } = await supabase.from("user_stats").select("wallet_balance").eq("user_id", user.id).maybeSingle();
    setBalance(Number(stats?.wallet_balance || 0));

    const { data: txns } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setTransactions((txns || []) as WalletTransaction[]);
  };

  const fetchReferrals = async () => {
    if (!user || !profile) return;
    setReferralCode(profile?.referral_code || "");
    const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user.id);
    if (data) {
      const signedUp = data.filter(r => r.status !== 'pending').length;
      const booked = data.filter(r => r.booking_reward_paid).length;
      const earned = signedUp * 5 + booked * 10;
      setReferralStats({ total: data.length, signedUp, booked, earned });
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const shareWhatsApp = () => {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on ACE Coach! Sign up here: ${link}`)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Wallet Balance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet size={14} className="text-primary" /> WALLET
          </h3>
          <span className="font-display text-2xl text-foreground">€{balance.toFixed(2)}</span>
        </div>

        {transactions.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-xs font-body">
                <div className="flex items-center gap-2">
                  {Number(tx.amount) >= 0 ? (
                    <ArrowDownLeft size={12} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={12} className="text-red-400" />
                  )}
                  <span className="text-muted-foreground truncate max-w-[140px]">{tx.description || tx.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={Number(tx.amount) >= 0 ? "text-green-400" : "text-red-400"}>
                    {Number(tx.amount) >= 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground/50 text-[10px]">{format(new Date(tx.created_at), "d MMM")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral Card */}
      {referralCode && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">REFER & EARN</h3>

          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 mb-3">
            <span className="font-body text-xs text-foreground flex-1 truncate">{window.location.origin}/login?ref={referralCode}</span>
            <button onClick={copyReferralLink} className="p-1 text-primary hover:text-primary/80">
              <Copy size={14} />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600/20 text-green-400 font-display text-[10px] tracking-wider hover:bg-green-600/30 transition-colors">
              <MessageCircle size={12} /> WHATSAPP
            </button>
            <button onClick={copyReferralLink} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-muted-foreground font-display text-[10px] tracking-wider hover:text-foreground transition-colors">
              <Copy size={12} /> COPY LINK
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-display text-lg text-foreground">{referralStats.signedUp}</p>
              <p className="font-body text-[9px] text-muted-foreground">JOINED</p>
            </div>
            <div>
              <p className="font-display text-lg text-foreground">{referralStats.booked}</p>
              <p className="font-body text-[9px] text-muted-foreground">BOOKED</p>
            </div>
            <div>
              <p className="font-display text-lg text-foreground">€{referralStats.earned}</p>
              <p className="font-body text-[9px] text-muted-foreground">EARNED</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border space-y-1">
            <p className="font-body text-[10px] text-primary">💰 Earn €5 when a friend signs up</p>
            <p className="font-body text-[10px] text-primary">💰 Earn €10 more when they book their first session</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;
