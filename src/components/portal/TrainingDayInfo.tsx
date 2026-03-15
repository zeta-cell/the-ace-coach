import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Wind, Droplets, User, Target, ExternalLink } from "lucide-react";

interface TrainingDayInfoProps {
  playerId: string;
  date: string; // yyyy-MM-dd
}

interface PlanInfo {
  id: string;
  notes: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  start_time: string | null;
  end_time: string | null;
  focus_categories: string[];
}

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather_code: number;
  precipitation_probability: number;
}

const WEATHER_INFO: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mainly clear", icon: Sun },
  2: { label: "Partly cloudy", icon: Cloud },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Foggy", icon: Cloud },
  48: { label: "Rime fog", icon: Cloud },
  51: { label: "Light drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Dense drizzle", icon: CloudDrizzle },
  61: { label: "Light rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  71: { label: "Light snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Heavy showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm + hail", icon: CloudLightning },
  99: { label: "Severe thunderstorm", icon: CloudLightning },
};

const getWeatherInfo = (code: number) => {
  return WEATHER_INFO[code] || { label: "Unknown", icon: Cloud };
};

const CATEGORY_LABELS: Record<string, string> = {
  warm_up: "Warm-Up",
  padel_drill: "Padel Drill",
  footwork: "Footwork",
  fitness: "Fitness",
  strength: "Strength",
  mental: "Mental",
  recovery: "Recovery",
  cool_down: "Cool-Down",
  nutrition: "Nutrition",
  video: "Video",
};

const TrainingDayInfo = ({ playerId, date }: TrainingDayInfoProps) => {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanInfo();
  }, [playerId, date]);

  const fetchPlanInfo = async () => {
    setLoading(true);
    setWeather(null);

    const { data: planData } = await supabase
      .from("player_day_plans")
      .select("id, notes, location_name, location_address, location_lat, location_lng, coach_id, start_time, end_time")
      .eq("player_id", playerId)
      .eq("plan_date", date)
      .maybeSingle();

    if (!planData) {
      setPlan(null);
      setLoading(false);
      return;
    }

    // Fetch coach info
    const { data: coachProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", planData.coach_id)
      .single();

    // Fetch plan items to get focus categories
    const { data: items } = await supabase
      .from("player_day_plan_items")
      .select("module_id")
      .eq("plan_id", planData.id);

    const moduleIds = items?.map((i: any) => i.module_id) || [];
    let focusCategories: string[] = [];
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from("modules")
        .select("category")
        .in("id", moduleIds);
      const cats = modules?.map((m: any) => m.category) || [];
      // Count and pick top categories
      const catCount = new Map<string, number>();
      cats.forEach((c: string) => catCount.set(c, (catCount.get(c) || 0) + 1));
      focusCategories = [...catCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);
    }

    const info: PlanInfo = {
      id: planData.id,
      notes: planData.notes,
      location_name: (planData as any).location_name,
      location_address: (planData as any).location_address,
      location_lat: (planData as any).location_lat,
      location_lng: (planData as any).location_lng,
      coach_id: planData.coach_id,
      coach_name: coachProfile?.full_name || "Coach",
      coach_avatar: coachProfile?.avatar_url || null,
      start_time: planData.start_time,
      end_time: planData.end_time,
      focus_categories: focusCategories,
    };

    setPlan(info);
    setLoading(false);

    // Fetch weather if we have coordinates
    if (info.location_lat && info.location_lng) {
      fetchWeather(Number(info.location_lat), Number(info.location_lng), date);
    }
  };

  const fetchWeather = async (lat: number, lng: number, dateStr: string) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,weathercode,windspeed_10m_max&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const d = data.daily;
      if (d && d.temperature_2m_max?.[0] != null) {
        setWeather({
          temp: Math.round((d.temperature_2m_max[0] + d.temperature_2m_min[0]) / 2),
          feels_like: Math.round(d.apparent_temperature_max[0]),
          humidity: 0,
          wind_speed: Math.round(d.windspeed_10m_max[0]),
          weather_code: d.weathercode[0],
          precipitation_probability: d.precipitation_probability_max[0] || 0,
        });
      }
    } catch {
      // Weather is non-critical
    }
  };

  const googleMapsUrl = plan?.location_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location_address)}`
    : plan?.location_lat && plan?.location_lng
      ? `https://www.google.com/maps?q=${plan.location_lat},${plan.location_lng}`
      : null;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-secondary rounded-lg" />
          <div className="h-16 bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const weatherInfo = weather ? getWeatherInfo(weather.weather_code) : null;
  const WeatherIcon = weatherInfo?.icon || Cloud;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="font-display text-sm tracking-wider text-muted-foreground">SESSION INFO</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Location */}
        <div className="bg-secondary rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-primary shrink-0" />
            <span className="font-display text-[10px] tracking-wider text-muted-foreground">LOCATION</span>
          </div>
          {plan.location_name ? (
            <>
              <p className="font-body text-sm text-foreground font-medium leading-tight">{plan.location_name}</p>
              {plan.location_address && (
                <p className="font-body text-[10px] text-muted-foreground line-clamp-2">{plan.location_address}</p>
              )}
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary text-[10px] font-display tracking-wider hover:underline mt-1"
                >
                  <ExternalLink size={10} /> OPEN MAP
                </a>
              )}
            </>
          ) : (
            <p className="font-body text-xs text-muted-foreground italic">Not set</p>
          )}
        </div>

        {/* Weather */}
        <div className="bg-secondary rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Cloud size={14} className="text-primary shrink-0" />
            <span className="font-display text-[10px] tracking-wider text-muted-foreground">WEATHER</span>
          </div>
          {weather ? (
            <>
              <div className="flex items-center gap-2">
                <WeatherIcon size={22} className="text-foreground shrink-0" />
                <span className="font-display text-2xl text-foreground">{weather.temp}°</span>
              </div>
              <p className="font-body text-[10px] text-muted-foreground">{weatherInfo?.label}</p>
              <div className="flex items-center gap-3 text-[10px] font-body text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Droplets size={9} /> {weather.precipitation_probability}%
                </span>
                <span className="flex items-center gap-0.5">
                  <Wind size={9} /> {weather.wind_speed} km/h
                </span>
              </div>
            </>
          ) : plan.location_lat ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-body text-muted-foreground">Loading…</span>
            </div>
          ) : (
            <p className="font-body text-xs text-muted-foreground italic">Set location for weather</p>
          )}
        </div>

        {/* Coach */}
        <div className="bg-secondary rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-primary shrink-0" />
            <span className="font-display text-[10px] tracking-wider text-muted-foreground">COACH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              {plan.coach_avatar ? (
                <img src={plan.coach_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-xs text-primary">
                  {plan.coach_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="font-body text-sm text-foreground font-medium truncate">{plan.coach_name}</p>
          </div>
        </div>

        {/* Focus */}
        <div className="bg-secondary rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Target size={14} className="text-primary shrink-0" />
            <span className="font-display text-[10px] tracking-wider text-muted-foreground">FOCUS</span>
          </div>
          {plan.focus_categories.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {plan.focus_categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-body font-semibold uppercase"
                >
                  {CATEGORY_LABELS[cat] || cat.replace("_", " ")}
                </span>
              ))}
            </div>
          ) : plan.notes ? (
            <p className="font-body text-xs text-foreground line-clamp-2">{plan.notes}</p>
          ) : (
            <p className="font-body text-xs text-muted-foreground italic">General training</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {plan.notes && plan.focus_categories.length > 0 && (
        <p className="font-body text-xs text-muted-foreground italic bg-secondary/50 rounded-lg px-3 py-2">
          "{plan.notes}"
        </p>
      )}
    </div>
  );
};

export default TrainingDayInfo;
