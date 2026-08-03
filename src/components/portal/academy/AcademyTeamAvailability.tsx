import { useState } from "react";
import CoachAvailabilityGrid from "@/components/portal/CoachAvailabilityGrid";
import type { AcademyCoach } from "@/hooks/useAcademy";

interface Props {
  coaches: AcademyCoach[];
  selfId: string;
  selfName: string;
}

const AcademyTeamAvailability = ({ coaches, selfId, selfName }: Props) => {
  const options = [
    { id: selfId, name: `${selfName} (you)` },
    ...coaches.filter((c) => c.coach_id !== selfId).map((c) => ({ id: c.coach_id, name: c.full_name })),
  ];
  const [selected, setSelected] = useState(selfId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o.id)}
            className={`px-3 py-2 rounded-lg font-display text-[10px] tracking-wider whitespace-nowrap border ${
              selected === o.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {o.name.toUpperCase()}
          </button>
        ))}
      </div>
      <CoachAvailabilityGrid key={selected} coachId={selected} />
    </div>
  );
};

export default AcademyTeamAvailability;
