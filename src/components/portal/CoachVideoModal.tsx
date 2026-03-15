import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface CoachVideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  moduleTitle: string;
  coachName?: string;
  coachAvatar?: string | null;
  coachSlug?: string | null;
}

const getSignedUrl = async (path: string): Promise<string> => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("coach-videos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl || "";
};

const CoachVideoModal = ({
  open, onClose, videoUrl, moduleTitle, coachName, coachAvatar, coachSlug,
}: CoachVideoModalProps) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (open && videoUrl) {
      getSignedUrl(videoUrl).then(setSrc);
    }
  }, [open, videoUrl]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Coach header */}
            {coachName && (
              <div className="flex items-center gap-3 p-4 border-b border-border">
                {coachAvatar ? (
                  <img src={coachAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                    {coachName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-display text-sm text-foreground">{coachName}</p>
                  <p className="text-xs font-body text-muted-foreground">{moduleTitle}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Video */}
            <div className="aspect-video bg-black">
              {src ? (
                <video src={src} controls className="w-full h-full" autoPlay />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play size={32} className="text-white/50" />
                </div>
              )}
            </div>

            {/* CTA */}
            {coachSlug && (
              <div className="p-4 border-t border-border">
                <Link
                  to={`/book/${coachSlug}`}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Liked it? Book a session with {coachName} →
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachVideoModal;
