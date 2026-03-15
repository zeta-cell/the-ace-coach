import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Play, X, MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface PlayerVideo {
  id: string;
  player_id: string;
  player_name: string;
  title: string;
  description: string | null;
  video_url: string | null;
  shot_tag: string | null;
  coach_feedback: string | null;
  created_at: string;
}

// FIX 4: resolve storage path to signed URL on-the-fly
const getVideoUrl = async (path: string): Promise<string> => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("progress-videos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl || "";
};

const VideoPlayer = ({ path, className }: { path: string; className?: string }) => {
  const [src, setSrc] = useState("");
  useEffect(() => { getVideoUrl(path).then(setSrc); }, [path]);
  if (!src) return <div className={`bg-secondary animate-pulse ${className}`} />;
  return <video src={src} controls className={className} />;
};

const VideoThumbnail = ({ path, className }: { path: string; className?: string }) => {
  const [src, setSrc] = useState("");
  useEffect(() => { getVideoUrl(path).then(setSrc); }, [path]);
  if (!src) return <div className={`bg-secondary animate-pulse ${className}`} />;
  return <video src={src} className={className} preload="metadata" />;
};

const CoachVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<PlayerVideo | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", user.id);

    const playerIds = assignments?.map((a) => a.player_id) || [];
    if (playerIds.length === 0) {
      setLoading(false);
      return;
    }

    const [{ data: vids }, { data: profiles }] = await Promise.all([
      supabase
        .from("progress_videos")
        .select("*")
        .in("player_id", playerIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", playerIds),
    ]);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

    setVideos(
      (vids || []).map((v) => ({
        ...(v as any),
        player_name: nameMap.get(v.player_id) || "Unknown",
      }))
    );
    setLoading(false);
  };

  // FIX 9: only notify on NEW feedback, not edits
  const handleFeedback = async () => {
    if (!selectedVideo || !feedback.trim() || !user) return;
    setSaving(true);

    await supabase
      .from("progress_videos")
      .update({ coach_feedback: feedback.trim(), coach_id: user.id })
      .eq("id", selectedVideo.id);

    if (!selectedVideo.coach_feedback) {
      await supabase.from("notifications").insert({
        user_id: selectedVideo.player_id,
        title: "Coach feedback on your video",
        body: `Feedback on "${selectedVideo.title}": ${feedback.trim().substring(0, 80)}`,
        link: "/videos",
      });
    }

    setSelectedVideo({ ...selectedVideo, coach_feedback: feedback.trim() });
    toast.success("Feedback saved");
    setSaving(false);
    fetchVideos();
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-4">PLAYER VIDEOS</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <Video size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">No player videos yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => { setSelectedVideo(v); setFeedback(v.coach_feedback || ""); }}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="aspect-video bg-secondary flex items-center justify-center relative">
                  {v.video_url ? (
                    <VideoThumbnail path={v.video_url} className="w-full h-full object-cover" />
                  ) : (
                    <Video size={32} className="text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={32} className="text-white/80" />
                  </div>
                  {v.coach_feedback && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <MessageSquare size={12} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {v.player_name}
                    </span>
                    {v.shot_tag && (
                      <span className="text-[10px] font-body text-muted-foreground uppercase">{v.shot_tag}</span>
                    )}
                  </div>
                  <p className="font-display text-foreground">{v.title}</p>
                  <p className="text-[10px] font-body text-muted-foreground mt-1">
                    {format(new Date(v.created_at), "d MMM yyyy")}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail + feedback modal */}
        <AnimatePresence>
          {selectedVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setSelectedVideo(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-xl"
              >
                <div className="aspect-video bg-black">
                  {selectedVideo.video_url && (
                    <VideoPlayer path={selectedVideo.video_url} className="w-full h-full" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="font-display text-xl text-foreground">{selectedVideo.title}</h2>
                      <p className="text-xs font-body text-muted-foreground">by {selectedVideo.player_name}</p>
                    </div>
                    <button onClick={() => setSelectedVideo(null)}>
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>

                  {selectedVideo.description && (
                    <p className="font-body text-sm text-muted-foreground mt-2">{selectedVideo.description}</p>
                  )}

                  {/* Feedback area */}
                  <div className="mt-4">
                    <label className="font-display text-xs tracking-wider text-muted-foreground mb-2 block">
                      YOUR FEEDBACK
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Write feedback for the player..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <button
                      onClick={handleFeedback}
                      disabled={!feedback.trim() || saving}
                      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Send size={14} /> {saving ? "SAVING..." : "SEND FEEDBACK"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
};

export default CoachVideos;
