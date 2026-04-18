import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Clock, Tag, Play, Upload, Video, Loader2, ChevronDown } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import CoachVideoModal from "@/components/portal/CoachVideoModal";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ModuleCategory = Database["public"]["Enums"]["module_category"];
type ModuleDifficulty = Database["public"]["Enums"]["module_difficulty"];

const BASE_CATEGORIES: ModuleCategory[] = [
  "warm_up", "footwork", "fitness", "strength",
  "mental", "recovery", "cool_down", "nutrition", "video",
];

const SPORT_CATEGORIES: Record<string, ModuleCategory[]> = {
  padel: ["padel_drill"],
  tennis: ["tennis_drill"],
};

const getAllCategories = (sport: string | null): ModuleCategory[] => {
  const sportCats = sport ? (SPORT_CATEGORIES[sport] || []) : [...SPORT_CATEGORIES.padel, ...SPORT_CATEGORIES.tennis];
  return [...sportCats, ...BASE_CATEGORIES];
};

const DIFFICULTIES: ModuleDifficulty[] = ["beginner", "intermediate", "advanced", "elite"];

const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500/20 text-yellow-400",
  padel_drill: "bg-cyan-500/20 text-cyan-400",
  footwork: "bg-blue-500/20 text-blue-400",
  fitness: "bg-orange-500/20 text-orange-400",
  strength: "bg-orange-600/20 text-orange-300",
  mental: "bg-purple-500/20 text-purple-400",
  recovery: "bg-green-500/20 text-green-400",
  cool_down: "bg-teal-500/20 text-teal-400",
  nutrition: "bg-lime-500/20 text-lime-400",
  video: "bg-pink-500/20 text-pink-400",
  tennis_drill: "bg-emerald-500/20 text-emerald-400",
};

interface Module {
  id: string;
  title: string;
  category: ModuleCategory;
  difficulty: ModuleDifficulty | null;
  duration_minutes: number | null;
  description: string | null;
  instructions: string | null;
  player_description: string | null;
  coach_description: string | null;
  video_url: string | null;
  coach_video_url: string | null;
  tags: string[] | null;
  equipment: string[] | null;
  is_shared: boolean | null;
  sport: string | null;
}

const emptyForm = {
  title: "",
  category: "padel_drill" as ModuleCategory,
  difficulty: "beginner" as ModuleDifficulty,
  duration_minutes: 15,
  description: "",
  instructions: "",
  player_description: "",
  coach_description: "",
  video_url: "",
  tags: "",
  equipment: "",
  is_shared: false,
};

export const CoachModulesContent = ({ embedded = false }: { embedded?: boolean }) => {
  const { user, role } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ModuleCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState("");
  const [videoModalTitle, setVideoModalTitle] = useState("");
  const [descView, setDescView] = useState<Record<string, "player" | "coach">>({});
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [coachSport, setCoachSport] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      fetchCoachSport();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchModules();
    }
  }, [user, coachSport]);

  const fetchCoachSport = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_profiles")
      .select("primary_sport")
      .eq("user_id", user.id)
      .single();
    if (data) setCoachSport((data as any).primary_sport);
  };

  const fetchModules = async () => {
    if (!user) return;
    if (role === "admin") {
      // Admins see all modules
      const { data } = await supabase
        .from("modules").select("*")
        .order("created_at", { ascending: false });
      setModules((data as Module[]) || []);
    } else {
      // Coaches see: own modules + shared base modules + shared sport-specific modules
      const { data: ownModules } = await supabase
        .from("modules").select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      const { data: sharedModules } = await supabase
        .from("modules").select("*")
        .eq("is_shared", true)
        .neq("created_by", user.id)
        .in("sport", coachSport ? ["both", coachSport] : ["both", "padel", "tennis"])
        .order("created_at", { ascending: false });

      setModules([...(ownModules as Module[] || []), ...(sharedModules as Module[] || [])]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    const payload = {
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
      instructions: form.instructions || null,
      player_description: form.player_description || null,
      coach_description: form.coach_description || null,
      video_url: form.video_url || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      equipment: form.equipment ? form.equipment.split(",").map((e) => e.trim()).filter(Boolean) : [],
      is_shared: form.is_shared,
      created_by: user.id,
    };

    if (editingId) {
      await supabase.from("modules").update(payload).eq("id", editingId);
    } else {
      await supabase.from("modules").insert(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchModules();
  };

  const handleEdit = (mod: Module) => {
    setForm({
      title: mod.title,
      category: mod.category,
      difficulty: mod.difficulty || "beginner",
      duration_minutes: mod.duration_minutes || 15,
      description: mod.description || "",
      instructions: mod.instructions || "",
      player_description: mod.player_description || "",
      coach_description: mod.coach_description || "",
      video_url: mod.video_url || "",
      tags: mod.tags?.join(", ") || "",
      equipment: mod.equipment?.join(", ") || "",
      is_shared: mod.is_shared || false,
    });
    setEditingId(mod.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module?")) return;
    await supabase.from("modules").delete().eq("id", id);
    toast.success("Module deleted", { duration: 1500 });
    fetchModules();
  };

  const handleCoachVideoUpload = async (moduleId: string, file: File) => {
    if (!user) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large (max 100MB)");
      return;
    }
    setUploadingVideoId(moduleId);
    const ext = file.name.split(".").pop();
    const path = `modules/${moduleId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("coach-videos").upload(path, file, { contentType: file.type });
    if (error) {
      toast.error("Upload failed");
      setUploadingVideoId(null);
      return;
    }
    await supabase.from("modules").update({ coach_video_url: path } as any).eq("id", moduleId);
    toast.success("Demo video uploaded!", { duration: 1500 });
    setUploadingVideoId(null);
    fetchModules();
  };

  const filtered = modules.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || m.category === filterCat;
    return matchSearch && matchCat;
  });

  const content = (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl text-foreground">TRAINING LIBRARY</h1>
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> NEW MODULE
          </button>
        </div>

        {/* Search & filter */}
        {/* Category filter strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {(["all", ...getAllCategories(role === "admin" ? null : coachSport)] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat === "all" ? "ALL" : cat.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Module list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="font-body text-muted-foreground">No modules found. Create your first!</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full uppercase ${CATEGORY_COLORS[mod.category] || "bg-muted text-muted-foreground"}`}>
                      {mod.category.replace("_", " ")}
                    </span>
                    <h3 className="font-display text-lg text-foreground mt-1">{mod.title}</h3>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${expandedModuleId === mod.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => handleEdit(mod)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(mod.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs font-body text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={12} /> {mod.duration_minutes || 0} min</span>
                  <span>{mod.difficulty}</span>
                  {mod.is_shared && <span className="text-primary">shared</span>}
                  {mod.video_url && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-xs font-body">
                      <Play className="w-2.5 h-2.5" /> video
                    </span>
                  )}
                  {mod.coach_video_url && (
                    <button onClick={() => { setVideoModalUrl(mod.coach_video_url!); setVideoModalTitle(mod.title); setVideoModalOpen(true); }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-body hover:bg-primary/20 transition-colors">
                      <Video className="w-2.5 h-2.5" /> demo
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {expandedModuleId === mod.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        {mod.description && (
                          <p className="text-xs font-body text-muted-foreground">{mod.description}</p>
                        )}
                        {mod.instructions && (
                          <div>
                            <span className="text-[10px] font-display text-foreground/70 uppercase tracking-wider">Instructions</span>
                            <p className="text-xs font-body text-muted-foreground mt-0.5 whitespace-pre-line">{mod.instructions}</p>
                          </div>
                        )}
                        {mod.tags && mod.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {mod.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-body px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}
                        {mod.equipment && mod.equipment.length > 0 && (
                          <p className="text-[10px] font-body text-muted-foreground">Equipment: {mod.equipment.join(", ")}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Coach video upload */}
                <div className="mt-2 flex items-center gap-2">
                  {!mod.coach_video_url ? (
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground text-[10px] font-body hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      <Upload size={10} /> Add demo video
                      <input type="file" accept="video/mp4,video/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleCoachVideoUpload(mod.id, f); e.target.value = ""; }} />
                    </label>
                  ) : (
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground text-[10px] font-body hover:text-foreground transition-colors cursor-pointer">
                      <Upload size={10} /> Replace video
                      <input type="file" accept="video/mp4,video/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleCoachVideoUpload(mod.id, f); e.target.value = ""; }} />
                    </label>
                  )}
                  {uploadingVideoId === mod.id && <Loader2 size={14} className="animate-spin text-primary" />}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-foreground">{editingId ? "EDIT MODULE" : "NEW MODULE"}</h2>
                  <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
                </div>

                <div className="space-y-3">
                  <input
                    placeholder="Module title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as ModuleCategory })}
                      className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                    >
                      {getAllCategories(role === "admin" ? null : coachSport).map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                    </select>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value as ModuleDifficulty })}
                      className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="Duration (min)"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none"
                  />
                  <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none"
                  />
                  <textarea
                    placeholder="Instructions (step by step)"
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none"
                  />
                  <input
                    placeholder="YouTube URL"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none"
                  />
                  {form.video_url && (() => {
                    const match = form.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
                    const ytId = match ? match[1] : null;
                    return ytId ? (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen title="Video preview" />
                      </div>
                    ) : null;
                  })()}
                  <input
                    placeholder="Tags (comma separated)"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none"
                  />
                  <input
                    placeholder="Equipment (comma separated)"
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none"
                  />
                  <label className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={form.is_shared}
                      onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
                      className="rounded"
                    />
                    Share with other coaches
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors"
                >
                  {editingId ? "UPDATE MODULE" : "CREATE MODULE"}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CoachVideoModal
          open={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoUrl={videoModalUrl}
          moduleTitle={videoModalTitle}
          coachName={user ? "You" : undefined}
        />
      </div>
  );

  if (embedded) return content;
  return <PortalLayout>{content}</PortalLayout>;
};

const CoachModules = () => <CoachModulesContent />;
export default CoachModules;
