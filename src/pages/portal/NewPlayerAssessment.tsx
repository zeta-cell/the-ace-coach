import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  Mail,
  Phone,
  Share2,
  Sparkles,
  User,
} from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import AssessmentDrawer from "@/components/portal/AssessmentDrawer";
import ClubListEditor from "@/components/portal/ClubListEditor";
import { PlayerClub } from "@/lib/coachInvite";

const makeToken = () =>
  (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 40);

/**
 * Assessment-first onboarding: the coach captures the player's contact details,
 * writes the assessment, and then shares one link where the player only has to
 * set a password to unlock their card.
 */
const NewPlayerAssessment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [clubs, setClubs] = useState<PlayerClub[]>([]);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = token ? `${window.location.origin}/invite/${token}` : "";

  const createInvite = async () => {
    if (!user) return;
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (!name) return toast.error("Please enter the player's name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return toast.error("Please enter a valid email");

    setSaving(true);
    const newToken = makeToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const { data, error } = await supabase
      .from("coach_invites")
      .insert({
        coach_id: user.id,
        full_name: name.slice(0, 120),
        email: mail.slice(0, 255),
        phone: phone.trim().slice(0, 40) || null,
        note: note.trim().slice(0, 500) || null,
        clubs: clubs.filter((c) => c.name.trim()) as any,
        token: newToken,
        expires_at: expires.toISOString(),
      } as any)
      .select("id, token")
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error("Could not create the player", { description: error?.message });
      return;
    }
    setInviteId(data.id);
    setToken(data.token);
    setStep(2);
    setDrawerOpen(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const text = `Hi ${fullName.split(" ")[0] || "there"}, your training assessment is ready. Open the link and set a password to see your player card: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Your Hi Volley assessment", text, url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const Steps = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-secondary"}`}
        />
      ))}
    </div>
  );

  return (
    <PortalLayout>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate("/coach/players")}
          className="inline-flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> PLAYERS
        </button>

        <h1 className="font-display text-3xl text-foreground mb-1">NEW PLAYER</h1>
        <p className="font-body text-sm text-muted-foreground mb-5">
          Assess first, invite after — the player receives a finished report and only sets a password.
        </p>

        <Steps />

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
                <User size={13} className="text-primary" /> FULL NAME
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Maria Lopez"
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
                <Mail size={13} className="text-primary" /> EMAIL
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                maxLength={255}
                placeholder="player@email.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 font-body text-[11px] text-muted-foreground">
                The player can change this later in their profile.
              </p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
                <Phone size={13} className="text-primary" /> PHONE (OPTIONAL)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                placeholder="+34 …"
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <ClubListEditor value={clubs} onChange={setClubs} label="CLUBS THEY TRAIN AT" />

            <div>
              <label className="font-display text-xs tracking-wider text-muted-foreground">
                PERSONAL NOTE (OPTIONAL)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Shown to the player on the invite page"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={createInvite}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <ClipboardCheck size={16} /> {saving ? "SAVING…" : "CONTINUE TO ASSESSMENT"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <ClipboardCheck size={28} className="mx-auto mb-3 text-primary" />
            <p className="font-display text-sm tracking-wider text-foreground">
              ASSESSMENT FOR {fullName.toUpperCase()}
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Rate the 8 shots and add your notes. The report unlocks once the player sets a password.
            </p>
            <button
              onClick={() => setDrawerOpen(true)}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              OPEN ASSESSMENT
            </button>
            <button
              onClick={() => setStep(3)}
              className="mt-2 w-full rounded-xl bg-secondary py-3 font-display text-xs tracking-wider text-muted-foreground hover:text-foreground"
            >
              SKIP FOR NOW
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
              <Sparkles size={16} className="mt-0.5 text-primary" />
              <p className="font-body text-sm text-foreground">
                Ready! Send this link to {fullName || "the player"} — they only set a password to unlock
                their assessment and player card.
              </p>
            </div>

            <div className="mt-4 break-all rounded-lg border border-border bg-secondary px-3 py-2.5 font-body text-xs text-muted-foreground">
              {link}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={copy}
                className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 font-display text-xs tracking-wider text-foreground hover:bg-secondary/80"
              >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                {copied ? "COPIED" : "COPY LINK"}
              </button>
              <button
                onClick={share}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90"
              >
                <Share2 size={15} /> SHARE
              </button>
            </div>

            <button
              onClick={() => navigate("/coach/players")}
              className="mt-3 w-full rounded-xl border border-border py-3 font-display text-xs tracking-wider text-muted-foreground hover:text-foreground"
            >
              BACK TO PLAYERS
            </button>
          </div>
        )}

        <AssessmentDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          inviteId={inviteId}
          playerName={fullName}
          onSaved={() => setStep(3)}
        />
      </div>
    </PortalLayout>
  );
};

export default NewPlayerAssessment;
