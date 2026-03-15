import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Play, Clock } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO, isValid } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";

const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500",
  padel_drill: "bg-cyan-500",
  footwork: "bg-blue-500",
  fitness: "bg-orange-500",
  strength: "bg-orange-600",
  mental: "bg-purple-500",
  recovery: "bg-green-500",
  cool_down: "bg-teal-500",
  nutrition: "bg-lime-500",
  video: "bg-pink-500",
};

interface PlanItem {
  id: string;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  coach_note: string | null;
  module: {
    id: string;
    title: string;
    category: string;
    duration_minutes: number;
    description: string | null;
    instructions: string | null;
    video_url: string | null;
  };
}

const parseDateParam = (value: string | null) => {
  if (!value) return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
};

const Training = () => {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const playerParam = searchParams.get("player");

  const [selectedDay, setSelectedDay] = useState(() => parseDateParam(dateParam));
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [planNotes, setPlanNotes] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const targetPlayerId = role === "admin" || role === "coach"
    ? (playerParam || user?.id)
    : user?.id;

  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    setSelectedDay(parseDateParam(dateParam));
  }, [dateParam]);

  useEffect(() => {
    if (targetPlayerId) fetchDayPlan();
  }, [selectedDay, targetPlayerId]);

  const fetchDayPlan = async () => {
    if (!targetPlayerId) return;
    setLoading(true);
    const dayStr = format(selectedDay, "yyyy-MM-dd");

    const { data: plan } = await supabase
      .from("player_day_plans")
      .select("id, notes")
      .eq("player_id", targetPlayerId)
      .eq("plan_date", dayStr)
      .maybeSingle();

    if (!plan) {
      setPlanItems([]);
      setPlanNotes("");
      setLoading(false);
      return;
    }

    setPlanNotes(plan.notes || "");

    const { data: items } = await supabase
      .from("player_day_plan_items")
      .select("id, order_index, is_completed, completed_at, coach_note, module_id")
      .eq("plan_id", plan.id)
      .order("order_index");

    const moduleIds = items?.map((i) => i.module_id) || [];
    const { data: modules } = await supabase
      .from("modules")
      .select("id, title, category, duration_minutes, description, instructions, video_url")
      .in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

    const moduleMap = new Map(modules?.map((m) => [m.id, m]) || []);

    setPlanItems(
      (items || []).map((item) => ({
        ...item,
        module: moduleMap.get(item.module_id) || {
          id: item.module_id,
          title: "Unknown",
          category: "",
          duration_minutes: 0,
          description: null,
          instructions: null,
          video_url: null,
        },
      }))
    );
    setLoading(false);
  };

  const markComplete = async (itemId: string) => {
    await supabase
      .from("player_day_plan_items")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", itemId);

    setPlanItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_completed: true, completed_at: new Date().toISOString() } : item
      )
    );
  };

  const totalDuration = planItems.reduce((sum, i) => sum + i.module.duration_minutes, 0);

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-4">TRAINING</h1>

        {/* Day selector */}
        <div className="flex gap-2 mb-6">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-lg text-center transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-secondary text-foreground"
                      : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="font-display text-xs block">{format(day, "EEE")}</span>
                <span className="font-body text-xs">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        {planNotes && (
          <p className="text-sm font-body italic text-muted-foreground mb-4 bg-card border border-border rounded-lg p-3">
            {planNotes}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : planItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display text-xl text-muted-foreground">NO PLAN FOR THIS DAY</p>
            <p className="font-body text-sm text-muted-foreground mt-2">Your coach hasn't assigned a plan yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {planItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex">
                  <div className={`w-1 ${CATEGORY_COLORS[item.module.category] || "bg-muted"}`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                            {item.module.category.replace("_", " ")}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                            <Clock size={12} /> {item.module.duration_minutes} min
                          </span>
                        </div>
                        <h3 className="font-display text-lg text-foreground">{item.module.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.is_completed ? (
                          <button
                            onClick={() => markComplete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
                          >
                            COMPLETE
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-green-500 font-body text-xs">
                            <Check size={14} /> Done
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedItem === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {expandedItem === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-border"
                      >
                        {item.module.description && (
                          <p className="text-sm font-body text-muted-foreground mb-3">{item.module.description}</p>
                        )}
                        {item.module.instructions && (
                          <div className="text-sm font-body text-foreground mb-3 whitespace-pre-wrap">
                            {item.module.instructions}
                          </div>
                        )}
                        {item.module.video_url && (
                          <div className="aspect-video rounded-lg overflow-hidden mb-3">
                            <iframe
                              src={item.module.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                              className="w-full h-full"
                              allowFullScreen
                              loading="lazy"
                              title={item.module.title}
                            />
                          </div>
                        )}
                        {item.coach_note && (
                          <div className="bg-secondary rounded-lg p-3 mt-2">
                            <p className="text-xs font-display tracking-wider text-muted-foreground mb-1">COACH NOTE</p>
                            <p className="text-sm font-body text-foreground">{item.coach_note}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="text-center pt-4">
              <p className="text-xs font-body text-muted-foreground">
                Total: {totalDuration} minutes · {planItems.filter((i) => i.is_completed).length}/{planItems.length} completed
              </p>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Training;
