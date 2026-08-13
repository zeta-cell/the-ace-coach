import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { Check, MailX, TriangleAlert } from "lucide-react";

type State = "loading" | "valid" | "done" | "used" | "invalid";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;

const Unsubscribe = () => {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return setState("invalid");
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return setState("invalid");
        if (data?.used || data?.already_unsubscribed) return setState("used");
        setEmail(data?.email ?? null);
        setState("valid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    setState(error ? "invalid" : "done");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <div className="flex justify-center mb-6"><BrandLogo className="h-8" /></div>

        {state === "loading" && (
          <p className="font-body text-sm text-muted-foreground">Checking your link…</p>
        )}

        {state === "valid" && (
          <>
            <MailX size={28} className="mx-auto mb-3 text-primary" />
            <h1 className="font-display text-xl text-foreground mb-2">UNSUBSCRIBE</h1>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {email ? `Stop sending emails to ${email}?` : "Stop sending emails to this address?"}
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="w-full rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "SAVING…" : "CONFIRM UNSUBSCRIBE"}
            </button>
          </>
        )}

        {state === "done" && (
          <>
            <Check size={28} className="mx-auto mb-3 text-emerald-500" />
            <h1 className="font-display text-xl text-foreground mb-2">YOU'RE UNSUBSCRIBED</h1>
            <p className="font-body text-sm text-muted-foreground">
              You won't receive further emails from Hi Volley at this address.
            </p>
          </>
        )}

        {state === "used" && (
          <>
            <Check size={28} className="mx-auto mb-3 text-emerald-500" />
            <h1 className="font-display text-xl text-foreground mb-2">ALREADY DONE</h1>
            <p className="font-body text-sm text-muted-foreground">This address is already unsubscribed.</p>
          </>
        )}

        {state === "invalid" && (
          <>
            <TriangleAlert size={28} className="mx-auto mb-3 text-amber-500" />
            <h1 className="font-display text-xl text-foreground mb-2">LINK NOT VALID</h1>
            <p className="font-body text-sm text-muted-foreground">
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
