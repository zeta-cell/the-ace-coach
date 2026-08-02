import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, User } from "lucide-react";
import { SHOT_KEYS, Assessment, assessmentAverage, deltaColor, formatDelta } from "@/lib/assessments";

const SHOT_COLORS: Record<string, string> = {
  volley_pct: "#34d399",
  forehand_pct: "#f97316",
  serve_pct: "#38bdf8",
  smash_pct: "#a78bfa",
  backhand_pct: "#fbbf24",
  lob_pct: "#f472b6",
  bandeja_pct: "#22d3ee",
  vibora_pct: "#fb7185",
};

interface Props {
  playerId: string;
  refreshKey?: number;
}

interface Row {
  date: string;
  label: string;
  coach: string;
  overall: number;
  [key: string]: string | number;
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number;
  color?: string;
  payload?: Row;
}

const DevelopmentChart = ({ playerId, refreshKey = 0 }: Props) => {
  const [items, setItems] = useState<Assessment[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string[]>(SHOT_KEYS.map((s) => s.key));

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("player_assessments")
        .select("*")
        .eq("player_id", playerId)
        .order("assessment_date", { ascending: true });
      if (!alive) return;
      const list = (data || []) as Assessment[];
      setItems(list);

      const ids = Array.from(new Set(list.map((a) => a.coach_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        if (!alive) return;
        const map: Record<string, string> = {};
        (profs || []).forEach((p) => {
          map[p.user_id as string] = (p.full_name as string) || "Coach";
        });
        setCoaches(map);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [playerId, refreshKey]);

  const rows = useMemo<Row[]>(
    () =>
      items.map((a) => {
        const row: Row = {
          date: a.assessment_date,
          label: format(parseISO(a.assessment_date), "dd MMM"),
          coach: coaches[a.coach_id] || "Coach",
          overall: assessmentAverage(a),
        };
        SHOT_KEYS.forEach((s) => {
          row[s.key] = Number(a[s.key]) || 0;
        });
        return row;
      }),
    [items, coaches]
  );

  const toggle = (key: string) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const first = items[0];
  const last = items[items.length - 1];
  const totalDelta = items.length > 1 ? assessmentAverage(last) - assessmentAverage(first) : null;

  const CustomTooltip = ({ active: on, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number }) => {
    if (!on || !payload?.length) return null;
    const row = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-xl">
        <p className="font-display text-xs text-foreground">{label}</p>
        {row?.coach && (
          <p className="mb-1 flex items-center gap-1 font-body text-[10px] text-muted-foreground">
            <User size={10} className="text-primary" /> {row.coach}
          </p>
        )}
        {payload.map((p) => (
          <p key={String(p.dataKey)} className="font-body text-[11px]" style={{ color: p.color }}>
            {p.name}: {p.value}%
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-xs tracking-wider text-muted-foreground">
          <TrendingUp size={14} className="text-primary" /> DEVELOPMENT
        </h3>
        {totalDelta !== null && (
          <span className={`font-display text-xs ${deltaColor(totalDelta)}`}>
            {formatDelta(totalDelta)} overall since {format(parseISO(first.assessment_date), "dd MMM yyyy")}
          </span>
        )}
      </div>
      <p className="mb-4 font-body text-[11px] text-muted-foreground">
        Last assessed {format(parseISO(last.assessment_date), "dd MMM yyyy")} by {coaches[last.coach_id] || "your coach"}
      </p>

      <div className="h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} width={32} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="overall"
              name="Overall"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            {SHOT_KEYS.filter((s) => active.includes(s.key)).map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={SHOT_COLORS[s.key]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SHOT_KEYS.map((s) => {
          const on = active.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-[11px] transition-colors ${
                on ? "border-border bg-secondary text-foreground" : "border-border/60 text-muted-foreground"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? SHOT_COLORS[s.key] : "hsl(var(--muted-foreground))" }}
              />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DevelopmentChart;
