import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, User, Layers, Check, Loader2, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AssignBlockToPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  block: {
    id: string;
    title: string;
    module_ids: string[];
    module_durations: number[];
    module_notes: string[];
    duration_minutes: number;
  } | null;
}

interface PlayerOption {
  player_id: string;
  full_name: string;
  avatar_url: string | null;
}

const AssignBlockToPlayerDialog = ({ open, onClose, block }: AssignBlockToPlayerDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open && user) fetchPlayers();
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setSelectedPlayer(null);
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("");
      setEndTime("");
      setLocation("");
    }
  }, [open]);

  const fetchPlayers = async () => {
    if (!user) return;
    setLoadingPlayers(true);
    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", user.id);

    if (!assignments || assignments.length === 0) {
      setPlayers([]);
      setLoadingPlayers(false);
      return;
    }

    const playerIds = assignments.map((a) => a.player_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", playerIds);

    setPlayers(
      (profiles || []).map((p) => ({
        player_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }))
    );
    setLoadingPlayers(false);
  };

  const handleAssign = async () => {
    if (!user || !block || !selectedPlayer || !selectedDate) return;
    setAssigning(true);

    const { data: existingPlans } = await supabase
      .from("player_day_plans")
      .select("id")
      .eq("player_id", selectedPlayer)
      .eq("plan_date", selectedDate);

    let planId: string;

    if (existingPlans && existingPlans.length > 0) {
      planId = existingPlans[0].id;
      const updates: Record<string, any> = {};
      if (startTime) updates.start_time = startTime;
      if (endTime) updates.end_time = endTime;
      if (location) updates.location_name = location;
      if (Object.keys(updates).length > 0) {
        await supabase.from("player_day_plans").update(updates).eq("id", planId);
      }
    } else {
      const { data: newPlan, error } = await supabase
        .from("player_day_plans")
        .insert({
          player_id: selectedPlayer,
          coach_id: user.id,
          plan_date: selectedDate,
          notes: "",
          start_time: startTime || null,
          end_time: endTime || null,
          location_name: location || null,
        })
        .select("id")
        .single();

      if (error || !newPlan) {
        toast.error("Failed to create plan");
        setAssigning(false);
        return;
      }
      planId = newPlan.id;
    }

    const { data: existingItems } = await supabase
      .from("player_day_plan_items")
      .select("id")
      .eq("plan_id", planId);

    const startIdx = existingItems?.length || 0;

    const inserts = block.module_ids.map((moduleId, idx) => ({
      plan_id: planId,
      module_id: moduleId,
      order_index: startIdx + idx,
      coach_note: block.module_notes[idx] || null,
      block_id: block.id,
    }));

    const { error: insertError } = await supabase
      .from("player_day_plan_items")
      .insert(inserts);

    if (insertError) {
      toast.error("Failed to assign block");
      setAssigning(false);
      return;
    }

    const playerName = players.find((p) => p.player_id === selectedPlayer)?.full_name || "player";
    toast.success(`"${block.title}" assigned to ${playerName} on ${format(new Date(selectedDate + "T00:00:00"), "MMM d")}`);
    setAssigning(false);
    onClose();
  };

  if (!block) return null;

  const formContent = (
    <div className="space-y-3 overflow-y-auto max-h-[55vh] px-4 pb-2">
      <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
        <p className="font-display text-xs text-foreground">{block.title}</p>
        <p className="text-[10px] font-body text-muted-foreground mt-0.5">
          {block.module_ids.length} modules · {block.duration_minutes} min
        </p>
      </div>

      <div>
        <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1.5 block">SELECT PLAYER</label>
        {loadingPlayers ? (
          <div className="flex justify-center py-3">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : players.length === 0 ? (
          <p className="text-xs font-body text-muted-foreground text-center py-3">No assigned players found</p>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-none">
            {players.map((player) => (
              <button
                key={player.player_id}
                onClick={() => setSelectedPlayer(player.player_id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  selectedPlayer === player.player_id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/50 border border-transparent hover:bg-secondary"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={12} className="text-muted-foreground" />
                  )}
                </div>
                <span className="font-body text-sm text-foreground flex-1 text-left">{player.full_name}</span>
                {selectedPlayer === player.player_id && <Check size={14} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1.5 block">DATE</label>
        <div className="relative">
          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1.5 block">TIME</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
            />
          </div>
          <span className="text-xs font-body text-muted-foreground">–</span>
          <div className="relative flex-1">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full pl-9 pr-2 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1.5 block">LOCATION</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Club Deportivo"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <div className="p-4 border-t border-border flex items-center gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-display text-[10px] tracking-wider hover:bg-secondary hover:text-foreground transition-colors"
      >
        CANCEL
      </button>
      <button
        onClick={handleAssign}
        disabled={!selectedPlayer || !selectedDate || assigning}
        className="flex-[2] py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {assigning ? (
          <><Loader2 size={12} className="animate-spin" /> ASSIGNING...</>
        ) : (
          <><Layers size={12} /> ASSIGN TO PLAYER</>
        )}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2 font-display text-sm tracking-wider text-foreground">
              <Layers size={16} className="text-primary" />
              ASSIGN BLOCK
            </DrawerTitle>
            <DrawerDescription className="sr-only">Assign a training block to a player</DrawerDescription>
          </DrawerHeader>
          {formContent}
          {footerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border p-0 max-w-md rounded-2xl">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 font-display text-sm tracking-wider text-foreground">
            <Layers size={16} className="text-primary" />
            ASSIGN BLOCK
          </DialogTitle>
          <DialogDescription className="sr-only">Assign a training block to a player</DialogDescription>
        </DialogHeader>
        <div className="pt-2">{formContent}</div>
        {footerContent}
      </DialogContent>
    </Dialog>
  );
};

export default AssignBlockToPlayerDialog;
