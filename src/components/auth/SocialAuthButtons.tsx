interface Props {
  onSelect: (provider: "google" | "apple") => void;
  className?: string;
  label?: string;
}

/** Google + Apple sign-in buttons (managed Lovable Cloud social login). */
const SocialAuthButtons = ({ onSelect, className = "", label = "or continue with" }: Props) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-border" />
      <span className="font-body text-xs text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onSelect("google")}
        className="flex items-center justify-center gap-2 bg-card border border-border rounded-lg py-3 font-display text-xs tracking-wider text-foreground hover:bg-secondary transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.1.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24c0-1.6-.1-2.8-.4-4.1H24v8.1h12.7c-.6 3.1-2.4 5.5-5 7.1l7.6 5.9c4.5-4.1 7.2-10.2 7.2-17z" />
          <path fill="#FBBC05" d="M10.4 28.2c-.5-1.4-.8-2.8-.8-4.2s.3-2.9.8-4.2l-7.8-6.1C.9 16.9 0 20.3 0 24s.9 7.1 2.6 10.3l7.8-6.1z" />
          <path fill="#34A853" d="M24 47.5c6.1 0 11.3-2 15.1-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.5 2.3-6.3 0-11.7-4.2-13.6-10.2l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z" />
        </svg>
        GOOGLE
      </button>
      <button
        type="button"
        onClick={() => onSelect("apple")}
        className="flex items-center justify-center gap-2 bg-card border border-border rounded-lg py-3 font-display text-xs tracking-wider text-foreground hover:bg-secondary transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.4 12.8c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.7.9-3.4.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1-2.1-2.1-.8-2.3-3.4-2.3-3.7zM14.3 4.9c.6-.8 1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-.9 2.9 1.1.1 2.2-.5 2.8-1.4z" />
        </svg>
        APPLE
      </button>
    </div>
  </div>
);

export default SocialAuthButtons;
