import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, startOfWeek, endOfWeek, getDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 to 21:00
const formatHour = (h: number) => `${h.toString().padStart(2, "0")}:00`;

// Convert JS getDay() (0=Sun) to our index (0=Mon)
const jsToGridDay = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

interface AvailabilityGridProps {
  coachId: string;
}

interface DateOverride {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
}

const CoachAvailabilityGrid = ({ coachId }: AvailabilityGridProps) => {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [grid, setGrid] = useState<boolean[][]>(
    () => DAYS.map(() => HOURS.map(() => false))
  );
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(true);

  // Month view state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateGrid, setDateGrid] = useState<boolean[]>(() => HOURS.map(() => false));
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [coachId]);

  useEffect(() => {
    if (viewMode === "month") loadDateOverrides();
  }, [coachId, currentMonth, viewMode]);

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const loadAvailability = async () => {
    const { data } = await supabase
      .from("coach_availability_slots")
      .select("day_of_week, start_time, end_time")
      .eq("coach_id", coachId)
      .eq("is_recurring", true);

    if (!data || data.length === 0) return;

    const newGrid = DAYS.map(() => HOURS.map(() => false));
    data.forEach((slot) => {
      const dayIdx = slot.day_of_week;
      if (dayIdx === null || dayIdx === undefined) return;
      const startHour = parseInt(slot.start_time.split(":")[0]);
      const endHour = parseInt(slot.end_time.split(":")[0]);
      for (let h = startHour; h < endHour; h++) {
        const hourIdx = h - 6;
        if (hourIdx >= 0 && hourIdx < HOURS.length && dayIdx < DAYS.length) {
          newGrid[dayIdx][hourIdx] = true;
        }
      }
    });
    setGrid(newGrid);
  };

  const loadDateOverrides = async () => {
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("coach_availability_slots")
      .select("id, specific_date, start_time, end_time, is_blocked")
      .eq("coach_id", coachId)
      .eq("is_recurring", false)
      .gte("specific_date", start)
      .lte("specific_date", end);
    setDateOverrides((data as DateOverride[]) || []);
  };

  const toggleSlot = (dayIdx: number, hourIdx: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx][hourIdx] = !next[dayIdx][hourIdx];
      return next;
    });
  };

  const setSlot = (dayIdx: number, hourIdx: number, value: boolean) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[dayIdx][hourIdx] = value;
      return next;
    });
  };

  const handleMouseDown = (dayIdx: number, hourIdx: number) => {
    const newValue = !grid[dayIdx][hourIdx];
    setIsDragging(true);
    setDragValue(newValue);
    setSlot(dayIdx, hourIdx, newValue);
  };

  const handleMouseEnter = (dayIdx: number, hourIdx: number) => {
    if (isDragging) {
      setSlot(dayIdx, hourIdx, dragValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("coach_availability_slots")
      .delete()
      .eq("coach_id", coachId)
      .eq("is_recurring", true);

    const slots: { coach_id: string; day_of_week: number; start_time: string; end_time: string; is_recurring: boolean }[] = [];
    for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
      let startHour: number | null = null;
      for (let hourIdx = 0; hourIdx <= HOURS.length; hourIdx++) {
        const isAvailable = hourIdx < HOURS.length && grid[dayIdx][hourIdx];
        if (isAvailable && startHour === null) {
          startHour = HOURS[hourIdx];
        } else if (!isAvailable && startHour !== null) {
          slots.push({
            coach_id: coachId,
            day_of_week: dayIdx,
            start_time: formatHour(startHour),
            end_time: formatHour(HOURS[hourIdx] || 22),
            is_recurring: true,
          });
          startHour = null;
        }
      }
    }

    if (slots.length > 0) {
      await supabase.from("coach_availability_slots").insert(slots as any);
    }

    toast.success("Availability saved!");
    setSaving(false);
  };

  // Month view helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getDayAvailability = (date: Date): "available" | "partial" | "blocked" | "none" => {
    const dateStr = format(date, "yyyy-MM-dd");
    const overrides = dateOverrides.filter(o => o.specific_date === dateStr);

    // Check if the whole day is blocked
    if (overrides.some(o => o.is_blocked)) return "blocked";

    // If there are specific overrides (non-blocked), it has custom availability
    if (overrides.length > 0) return "partial";

    // Fall back to recurring weekly availability
    const dayIdx = jsToGridDay(getDay(date));
    const hasSlots = grid[dayIdx]?.some(v => v);
    return hasSlots ? "available" : "none";
  };

  const handleDateClick = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(dateStr);

    // Load the date-specific grid: start with recurring, then apply overrides
    const date = new Date(dateStr + "T00:00:00");
    const dayIdx = jsToGridDay(getDay(date));
    const baseGrid = [...(grid[dayIdx] || HOURS.map(() => false))];

    const overrides = dateOverrides.filter(o => o.specific_date === dateStr);
    if (overrides.some(o => o.is_blocked)) {
      setDateGrid(HOURS.map(() => false));
    } else if (overrides.length > 0) {
      const newGrid = HOURS.map(() => false);
      overrides.forEach(o => {
        const startH = parseInt(o.start_time.split(":")[0]);
        const endH = parseInt(o.end_time.split(":")[0]);
        for (let h = startH; h < endH; h++) {
          const idx = h - 6;
          if (idx >= 0 && idx < HOURS.length) newGrid[idx] = true;
        }
      });
      setDateGrid(newGrid);
    } else {
      setDateGrid([...baseGrid]);
    }
  };

  const toggleDateSlot = (hourIdx: number) => {
    setDateGrid(prev => {
      const next = [...prev];
      next[hourIdx] = !next[hourIdx];
      return next;
    });
  };

  const handleSaveDateOverride = async () => {
    if (!selectedDate) return;
    setSavingDate(true);

    // Delete existing overrides for this date
    await supabase
      .from("coach_availability_slots")
      .delete()
      .eq("coach_id", coachId)
      .eq("is_recurring", false)
      .eq("specific_date", selectedDate);

    // Build contiguous slots
    const slots: any[] = [];
    let startHour: number | null = null;
    for (let hourIdx = 0; hourIdx <= HOURS.length; hourIdx++) {
      const isAvailable = hourIdx < HOURS.length && dateGrid[hourIdx];
      if (isAvailable && startHour === null) {
        startHour = HOURS[hourIdx];
      } else if (!isAvailable && startHour !== null) {
        slots.push({
          coach_id: coachId,
          specific_date: selectedDate,
          start_time: formatHour(startHour),
          end_time: formatHour(HOURS[hourIdx] || 22),
          is_recurring: false,
          is_blocked: false,
        });
        startHour = null;
      }
    }

    // If no slots at all, save a blocked entry
    if (slots.length === 0) {
      slots.push({
        coach_id: coachId,
        specific_date: selectedDate,
        start_time: "00:00",
        end_time: "23:59",
        is_recurring: false,
        is_blocked: true,
      });
    }

    await supabase.from("coach_availability_slots").insert(slots);
    toast.success("Date availability saved!");
    setSavingDate(false);
    loadDateOverrides();
  };

  const handleResetDate = async () => {
    if (!selectedDate) return;
    await supabase
      .from("coach_availability_slots")
      .delete()
      .eq("coach_id", coachId)
      .eq("is_recurring", false)
      .eq("specific_date", selectedDate);
    toast.success("Reset to default weekly hours");
    setSelectedDate(null);
    loadDateOverrides();
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-4"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm tracking-wider text-foreground">MY AVAILABILITY</h2>
          <p className="text-xs font-body text-muted-foreground mt-0.5">
            {viewMode === "week" ? "Click or drag to set your weekly available hours" : "Tap a date to customize availability"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
            {(["week", "month"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md font-display text-[10px] tracking-wider transition-colors ${
                  viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          {viewMode === "week" && (
            <>
              <div className="hidden md:flex gap-1">
                {[
                  { label: "9–5 WD", apply: () => setGrid(DAYS.map((_, d) => HOURS.map((h) => d < 5 && h >= 9 && h < 17))) },
                  { label: "EVES", apply: () => setGrid(DAYS.map((_, d) => HOURS.map((h) => d < 5 && h >= 17 && h < 21))) },
                  { label: "WKND", apply: () => setGrid(DAYS.map((_, d) => HOURS.map((h) => d >= 5 && h >= 9 && h < 18))) },
                  { label: "CLEAR", apply: () => setGrid(DAYS.map(() => HOURS.map(() => false))) },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={p.apply}
                    className="px-2 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-display text-[10px] tracking-wider transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save size={14} /> {saving ? "SAVING..." : "SAVE"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted border border-border" />
          Unavailable
        </div>
        {viewMode === "month" && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50" />
              Custom
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-destructive/30 border border-destructive/50" />
              Blocked
            </div>
          </>
        )}
      </div>

      {viewMode === "week" ? (
        /* ── WEEK VIEW ── */
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-0.5 mb-0.5">
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-center font-display text-[10px] tracking-wider text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {HOURS.map((hour, hourIdx) => (
              <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] gap-0.5 mb-0.5">
                <div className="flex items-center justify-end pr-2">
                  <span className="text-[10px] font-body text-muted-foreground">{formatHour(hour)}</span>
                </div>
                {DAYS.map((_, dayIdx) => {
                  const isAvailable = grid[dayIdx][hourIdx];
                  return (
                    <button
                      key={`${dayIdx}-${hourIdx}`}
                      onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dayIdx, hourIdx); }}
                      onMouseEnter={() => handleMouseEnter(dayIdx, hourIdx)}
                      className={`h-7 rounded transition-colors select-none ${
                        isAvailable
                          ? "bg-green-500/30 border border-green-500/50 hover:bg-green-500/40"
                          : "bg-muted border border-border hover:bg-secondary"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── MONTH VIEW ── */
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-2 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display text-sm tracking-wider text-foreground min-w-[160px] text-center">
              {format(currentMonth, "MMMM yyyy").toUpperCase()}
            </span>
            <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-2 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => (
              <div key={d} className="text-center font-display text-[10px] tracking-wider text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const status = getDayAvailability(day);
              const isSelected = selectedDate === dateStr;

              const statusStyles = {
                available: "bg-green-500/15 border-green-500/30",
                partial: "bg-yellow-500/15 border-yellow-500/30",
                blocked: "bg-destructive/15 border-destructive/30",
                none: "bg-muted border-border",
              };

              return (
                <button key={dateStr}
                  onClick={() => inMonth && handleDateClick(dateStr)}
                  disabled={!inMonth}
                  className={`min-h-[52px] p-1.5 rounded-xl border cursor-pointer transition-all text-center
                    ${!inMonth ? "opacity-20" : ""}
                    ${isSelected ? "ring-2 ring-primary border-primary" : statusStyles[status]}
                    ${today ? "ring-1 ring-primary/50" : ""}
                  `}
                >
                  <span className={`text-xs font-display ${today ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {inMonth && (
                    <div className="mt-1">
                      <div className={`w-2 h-2 rounded-full mx-auto ${
                        status === "available" ? "bg-green-400" :
                        status === "partial" ? "bg-yellow-400" :
                        status === "blocked" ? "bg-destructive" :
                        "bg-muted-foreground/20"
                      }`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date editor */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xs tracking-wider text-foreground">
                      {format(new Date(selectedDate + "T00:00:00"), "EEEE d MMMM").toUpperCase()}
                    </p>
                    <button onClick={() => setSelectedDate(null)} className="p-1 rounded-lg hover:bg-card">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>

                  <p className="text-[10px] font-body text-muted-foreground">
                    Tap hours to override availability for this specific date
                  </p>

                  {/* Compact hour grid */}
                  <div className="grid grid-cols-8 gap-1">
                    {HOURS.map((hour, hourIdx) => (
                      <button key={hour}
                        onClick={() => toggleDateSlot(hourIdx)}
                        className={`py-2 rounded-lg text-[10px] font-display tracking-wider transition-colors ${
                          dateGrid[hourIdx]
                            ? "bg-green-500/30 border border-green-500/50 text-green-300"
                            : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleSaveDateOverride} disabled={savingDate}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {savingDate ? "SAVING..." : "SAVE DATE"}
                    </button>
                    <button onClick={handleResetDate}
                      className="px-4 py-2.5 rounded-xl border border-border font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                      RESET
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CoachAvailabilityGrid;
