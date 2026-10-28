import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HASH = "ab989cc24506b627e339b885e8d564a39935399b1c9205d5ce983cac3378ec8f";
const KEY = "hv_site_unlocked";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function SitePasswordGate() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(KEY) === HASH);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (unlocked) return;
    const block = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-site-gate]")) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    };
    const opts = { capture: true };
    ["click", "pointerdown", "mousedown", "touchstart", "submit"].forEach((ev) =>
      document.addEventListener(ev, block, opts),
    );
    return () =>
      ["click", "pointerdown", "mousedown", "touchstart", "submit"].forEach((ev) =>
        document.removeEventListener(ev, block, opts),
      );
  }, [unlocked]);

  if (unlocked || !open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((await sha256(pw)) === HASH) {
      localStorage.setItem(KEY, HASH);
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div data-site-gate className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Private preview</h2>
        </div>
        <p className="text-sm text-muted-foreground">Enter the password to access Hi Volley.</p>
        <Input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setError(false); }} placeholder="Password" />
        {error && <p className="text-sm text-destructive">Wrong password.</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Unlock</Button>
        </div>
      </form>
    </div>
  );
}
