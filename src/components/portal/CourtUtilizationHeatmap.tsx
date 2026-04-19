import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22

const jsToGrid = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1);

interface Props { clubId: string; }

const CourtUtilizationHeatmap = ({ clubId }: Props) => {
  const [grid, setGrid] = useState<number[][]>(() => DAYS.map(() => HOURS.map(() => 0)));
  const [maxVal, setMaxVal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const { data } = await supabase
        .from("bookings")
        .select("booking_date, start_time, end_time, status")
        .eq("club_id", clubId)
        .in("status", ["pending", "confirmed", "completed"])
        .gte("booking_date", since.toISOString().split("T")[0]);

      const next = DAYS.map(() => HOURS.map(() => 0));
      let max = 0;
      (data || []).forEach((b: any) => {
        const day = jsToGrid(new Date(b.booking_date).getDay());
        const sh = parseInt(b.start_time.split(":")[0]);
        const eh = parseInt(b.end_time.split(":")[0]);
        for (let h = sh; h < eh; h++) {
          const idx = h - 7;
          if (idx >= 0 && idx < HOURS.length) {
            next[day][idx] += 1;
            if (next[day][idx] > max) max = next[day][idx];
          }
        }
      });
      setGrid(next);
      setMaxVal(max);
      setLoading(false);
    })();
  }, [clubId]);

  const intensity = (v: number) => {
    if (!maxVal || v === 0) return 0;
    return v / maxVal;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-foreground">Court Utilization</h2>
        <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Last 4 weeks</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : maxVal === 0 ? (
        <div className="text-sm text-muted-foreground">No bookings recorded yet.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid" style={{ gridTemplateColumns: `auto repeat(${HOURS.length}, minmax(20px, 1fr))` }}>
                <div />
                {HOURS.map((h) => (
                  <div key={h} className="text-[9px] font-body text-muted-foreground text-center pb-1">
                    {h}
                  </div>
                ))}
                {DAYS.map((day, dIdx) => (
                  <>
                    <div key={`d-${day}`} className="text-[10px] font-body text-muted-foreground uppercase tracking-wider pr-2 flex items-center">
                      {day}
                    </div>
                    {HOURS.map((_, hIdx) => {
                      const v = grid[dIdx][hIdx];
                      const a = intensity(v);
                      return (
                        <div
                          key={`${dIdx}-${hIdx}`}
                          title={v ? `${v} booking${v > 1 ? "s" : ""}` : "—"}
                          className="h-6 m-0.5 rounded-sm transition-colors"
                          style={{
                            background: a === 0 ? "hsl(var(--secondary))" : `hsl(var(--primary) / ${0.15 + a * 0.85})`,
                          }}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((a) => (
              <div key={a} className="w-4 h-3 rounded-sm" style={{ background: a === 0 ? "hsl(var(--secondary))" : `hsl(var(--primary) / ${0.15 + a * 0.85})` }} />
            ))}
            <span>More</span>
          </div>
        </>
      )}
    </Card>
  );
};

export default CourtUtilizationHeatmap;
