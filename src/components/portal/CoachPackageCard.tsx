import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Users, Clock, Zap } from "lucide-react";

interface CoachPackage {
  id: string;
  title: string;
  session_type: string;
  sport: string;
  duration_minutes: number;
  price_per_session: number;
  total_sessions: number | null;
  currency: string;
  description: string | null;
  is_active: boolean;
  max_group_size: number | null;
}

interface Props {
  pkg: CoachPackage;
  onEdit: (pkg: CoachPackage) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

const sessionTypeColors: Record<string, string> = {
  individual: "bg-primary/10 text-primary",
  group: "bg-accent/20 text-accent-foreground",
  kids: "bg-chart-4/20 text-chart-4",
  online: "bg-chart-2/20 text-chart-2",
};

const sportColors: Record<string, string> = {
  tennis: "bg-chart-1/20 text-chart-1",
  padel: "bg-chart-3/20 text-chart-3",
  both: "bg-secondary text-secondary-foreground",
};

const CoachPackageCard = ({ pkg, onEdit, onDelete, onToggleActive }: Props) => {
  return (
    <Card className={`relative transition-all ${!pkg.is_active ? "opacity-50" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-base tracking-wider text-foreground">{pkg.title.toUpperCase()}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(pkg)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Pencil size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => onDelete(pkg.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${sessionTypeColors[pkg.session_type] || "bg-secondary text-foreground"}`}>
            {pkg.session_type === "group" && <Users size={10} />}
            {pkg.session_type}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${sportColors[pkg.sport] || "bg-secondary text-foreground"}`}>
            {pkg.sport}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold">
            <Clock size={10} /> {pkg.duration_minutes}min
          </span>
        </div>

        {pkg.description && (
          <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>
        )}

        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <span className="font-display text-2xl text-foreground">
              {pkg.currency === "EUR" ? "€" : pkg.currency === "USD" ? "$" : pkg.currency === "GBP" ? "£" : pkg.currency}
              {Number(pkg.price_per_session).toFixed(0)}
            </span>
            <span className="font-body text-xs text-muted-foreground ml-1">/session</span>
            {pkg.total_sessions && (
              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                {pkg.total_sessions} sessions · Total {pkg.currency === "EUR" ? "€" : "$"}{(Number(pkg.price_per_session) * pkg.total_sessions).toFixed(0)}
              </p>
            )}
            {pkg.max_group_size && (
              <p className="font-body text-[10px] text-muted-foreground">Max {pkg.max_group_size} people</p>
            )}
          </div>
          <button
            onClick={() => onToggleActive(pkg.id, !pkg.is_active)}
            className={`px-3 py-1 rounded-full text-[10px] font-display tracking-wider transition-colors ${
              pkg.is_active
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {pkg.is_active ? "ACTIVE" : "INACTIVE"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachPackageCard;
export type { CoachPackage };
