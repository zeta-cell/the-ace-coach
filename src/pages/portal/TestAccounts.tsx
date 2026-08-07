import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Circle, Dumbbell, Crown, Building2 } from "lucide-react";

const accounts = [
  { email: "player.anna@the-ace.academy", label: "PLAYER", name: "Anna Müller", Icon: Circle, wrap: "bg-primary/20", color: "text-primary" },
  { email: "coach.francisco@the-ace.academy", label: "COACH", name: "Francisco López", Icon: Dumbbell, wrap: "bg-accent/20", color: "text-accent-foreground" },
  { email: "club.manager@the-ace.academy", label: "CLUB", name: "Club Manager", Icon: Building2, wrap: "bg-blue-500/20", color: "text-blue-400" },
  { email: "admin@the-ace.academy", label: "FOUNDER", name: "Admin Ace", Icon: Crown, wrap: "bg-secondary", color: "text-amber-400" },
];

const TestAccounts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const quickLogin = async (email: string) => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: "AceAcademy2026!" });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-body mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <h1 className="font-display text-2xl text-foreground tracking-wide mb-2">TEST ACCOUNTS</h1>
        <p className="text-muted-foreground text-sm font-body mb-6">Internal demo logins — one click to sign in.</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-body rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {accounts.map(({ email, label, name, Icon, wrap, color }) => (
            <button
              key={email}
              type="button"
              onClick={() => quickLogin(email)}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wrap}`}>
                <Icon size={18} className={color} />
              </div>
              <span className="font-display text-[10px] tracking-wider text-foreground">{label}</span>
              <span className="text-[9px] font-body text-muted-foreground">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestAccounts;
