import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, X, Play, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface ProgressVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  shot_tag: string | null;
  coach_feedback: string | null;
  created_at: string;
}

interface VideoComment {
  id: string;
  comment: string;
  created_at: string;
  author_id: string;
  author_name?: string;
}

const SHOT_TAGS = ["Forehand", "Backhand", "Serve", "Volley", "Smash", "Lob", "Footwork", "Rally", "Match"];

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

const PlayerVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<ProgressVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shotTag, setShotTag] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ProgressVideo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Comments state
  const [videoComments, setVideoComments] = useState<Record<string, VideoComment[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("progress_videos")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });
    const vids = (data as ProgressVideo[]) || [];
    setVideos(vids);
    setLoading(false);

    // Fetch comment counts for all videos
    if (vids.length > 0) {
      const videoIds = vids.map(v => v.id);
      const { data: comments } = await supabase
        .from("video_comments")
        .select("id, video_id, comment, created_at, author_id")
        .in("video_id", videoIds)
        .order("created_at", { ascending: true });

      if (comments && comments.length > 0) {
        const counts: Record<string, number> = {};
        const grouped: Record<string, VideoComment[]> = {};
        const authorIds = [...new Set(comments.map(c => c.author_id))];

        const { data: authors } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", authorIds);
        const authorMap = new Map(authors?.map(a => [a.user_id, a.full_name]) || []);

        comments.forEach(c => {
          counts[c.video_id] = (counts[c.video_id] || 0) + 1;
          if (!grouped[c.video_id]) grouped[c.video_id] = [];
          grouped[c.video_id].push({
            ...c,
            author_name: authorMap.get(c.author_id) || "Coach",
          });
        });

        setCommentCounts(counts);
        setVideoComments(grouped);
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("progress-videos")
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      toast.error("Upload failed", { description: uploadError.message });
      setUploading(false);
      return;
    }

    await supabase.from("progress_videos").insert({
      player_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      video_url: filePath,
      shot_tag: shotTag || null,
    });

    await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: 15,
      p_event_type: 'video_uploaded',
      p_description: 'Uploaded a progress video',
    });

    setShowUpload(false);
    setTitle("");
    setDescription("");
    setShotTag("");
    setFile(null);
    setUploading(false);
    fetchVideos();
  };

  const isNewComment = (videoId: string, commentDate: string) => {
    const lastViewed = localStorage.getItem(`last_viewed_video_${videoId}`);
    if (!lastViewed) return true;
    return new Date(commentDate) > new Date(lastViewed);
  };

  const handleSelectVideo = (v: ProgressVideo) => {
    setSelectedVideo(v);
    localStorage.setItem(`last_viewed_video_${v.id}`, new Date().toISOString());
  };

  const hasCoachComments = (videoId: string) => (commentCounts[videoId] || 0) > 0;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl text-foreground">MY VIDEOS</h1>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Upload size={16} /> UPLOAD
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <Video size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground mb-1">No videos uploaded yet.</p>
            <p className="font-body text-xs text-muted-foreground">Upload a progress video for your coach to review.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleSelectVideo(v)}
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
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {hasCoachComments(v.id) && (
                      <span className="flex items-center gap-0.5 bg-green-500/90 text-white text-[8px] font-display px-1.5 py-0.5 rounded-full">
                        FEEDBACK RECEIVED
                      </span>
                    )}
                    {(commentCounts[v.id] || 0) > 0 && (
                      <span className="flex items-center gap-0.5 bg-card/90 text-foreground text-[9px] font-body px-1.5 py-0.5 rounded-full">
                        💬 {commentCounts[v.id]}
                      </span>
                    )}
                    {v.coach_feedback && !hasCoachComments(v.id) && (
                      <MessageSquare size={16} className="text-primary" />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {v.shot_tag && (
                      <span className="text-[10px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                        {v.shot_tag}
                      </span>
                    )}
                    <span className="text-[10px] font-body text-muted-foreground">
                      {format(new Date(v.created_at), "d MMM yyyy")}
                    </span>
                  </div>
                  <p className="font-display text-foreground">{v.title}</p>
                  {v.coach_feedback && (
                    <p className="text-xs font-body text-primary mt-1 line-clamp-1">
                      💬 Coach feedback available
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Video detail modal */}
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
                    <h2 className="font-display text-xl text-foreground">{selectedVideo.title}</h2>
                    <button onClick={() => setSelectedVideo(null)}>
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                  {selectedVideo.shot_tag && (
                    <span className="text-xs font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                      {selectedVideo.shot_tag}
                    </span>
                  )}
                  {selectedVideo.description && (
                    <p className="font-body text-sm text-muted-foreground mt-3">{selectedVideo.description}</p>
                  )}
                  {selectedVideo.coach_feedback && (
                    <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs font-display text-primary mb-1 uppercase tracking-wider">Coach Feedback</p>
                      <p className="font-body text-sm text-foreground">{selectedVideo.coach_feedback}</p>
                    </div>
                  )}

                  {/* Coach comments section */}
                  {(videoComments[selectedVideo.id]?.length || 0) > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-display text-foreground mb-2 uppercase tracking-wider">COACH COMMENTS</p>
                      <div className="space-y-2">
                        {videoComments[selectedVideo.id]?.map(c => {
                          const isNew = isNewComment(selectedVideo.id, c.created_at);
                          return (
                            <div key={c.id} className="bg-secondary rounded-lg p-3 relative">
                              {isNew && (
                                <span className="absolute top-2 right-2 text-[8px] font-display bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                  NEW
                                </span>
                              )}
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-primary font-display text-[8px]">
                                    {(c.author_name || "C").charAt(0)}
                                  </span>
                                </div>
                                <span className="font-display text-[10px] text-foreground">{c.author_name}</span>
                                <span className="text-[9px] font-body text-muted-foreground">
                                  {format(new Date(c.created_at), "d MMM HH:mm")}
                                </span>
                              </div>
                              <p className="font-body text-xs text-foreground">{c.comment}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => !uploading && setShowUpload(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-foreground">UPLOAD VIDEO</h2>
                  <button onClick={() => !uploading && setShowUpload(false)}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Video title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none"
                  />
                  <select
                    value={shotTag}
                    onChange={(e) => setShotTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                  >
                    <option value="">Shot tag (optional)</option>
                    {SHOT_TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && f.size > 500 * 1024 * 1024) {
                        toast.error("File too large", { description: "Maximum size is 500MB." });
                        return;
                      }
                      setFile(f);
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-border text-muted-foreground font-body text-sm hover:border-primary hover:text-primary transition-colors flex flex-col items-center gap-2"
                  >
                    <Upload size={24} />
                    {file ? (
                      <span className="text-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    ) : (
                      <span>Select video file (max 500MB)</span>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || !title.trim() || uploading}
                  className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={16} className="animate-spin" /> UPLOADING...</> : "UPLOAD VIDEO"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  );
};

export default PlayerVideos;
