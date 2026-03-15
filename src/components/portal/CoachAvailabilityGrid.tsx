import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save } from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 to 21:00

const formatHour = (h: number) => `${h.toString().padStart(2, "0")}:00`;

interface AvailabilityGridProps {
  coachId: string;
}

const CoachAvailabilityGrid = ({ coachId }: AvailabilityGridProps) => {
  // grid[dayIndex][hourIndex] = available
  const [grid, setGrid] = useState<boolean[][]>(
    () => DAYS.map(() => HOURS.map(() => false))
  );
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [coachId]);

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

    // Delete existing recurring slots
    await supabase
      .from("coach_availability_slots")
      .delete()
      .eq("coach_id", coachId)
      .eq("is_recurring", true);

    // Build contiguous slots per day
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

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-4"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm tracking-wider text-foreground">MY AVAILABILITY</h2>
          <p className="text-xs font-body text-muted-foreground mt-0.5">Click or drag to set your weekly available hours</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save size={14} /> {saving ? "SAVING..." : "SAVE AVAILABILITY"}
        </button>
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
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-0.5 mb-0.5">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center font-display text-[10px] tracking-wider text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
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
    </div>
  );
};

export default CoachAvailabilityGrid;
