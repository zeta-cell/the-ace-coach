import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import ClassAttendees from "@/components/class/ClassAttendees";
import { Loader2, Trash2 } from "lucide-react";

export interface CalItem {
  kind: "booking" | "class";
  id: string;
  date: string; // yyyy-MM-dd
  start: string; // HH:mm:ss
  end: string;
  coach_id: string;
  court_id: string | null;
  court_number: string | null;
  title: string;
  sub?: string;
  count?: number;
  max?: number | null;
  min?: number;
  level_min?: number | null;
  level_max?: number | null;
}

interface Props {
  item: CalItem | null;
  onClose: () => void;
  onSaved: () => void;
  coaches: { id: string; name: string }[];
  courts: { id: string; court_number: string }[];
}

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

const CalendarItemSheet = ({ item, onClose, onSaved, coaches, courts }: Props) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [coach, setCoach] = useState("");
  const [court, setCourt] = useState("");
  const [max, setMax] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setDate(item.date);
    setStart(item.start.slice(0, 5));
    setEnd(item.end.slice(0, 5));
    setCoach(item.coach_id);
    setCourt(item.court_id || "");
    setMax(item.max != null ? String(item.max) : "");
  }, [item]);

  if (!item) return null;
  const isClass = item.kind === "class";
  const courtNo = courts.find((c) => c.id === court)?.court_number ?? null;

  const save = async () => {
    if (end <= start) { toast({ title: "End time must be after start", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = isClass
      ? await supabase.from("events").update({
          title: title.trim() || item.title,
          start_datetime: new Date(`${date}T${start}`).toISOString(),
          end_datetime: new Date(`${date}T${end}`).toISOString(),
          coach_id: coach,
          court_id: court || null,
          court_number: courtNo,
          max_participants: max ? parseInt(max) : null,
        }).eq("id", item.id)
      : await supabase.from("bookings").update({
          booking_date: date,
          start_time: `${start}:00`,
          end_time: `${end}:00`,
          coach_id: coach,
          court_id: court || null,
          court_number: courtNo,
        }).eq("id", item.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message.includes("conflict") ? "That court is already booked at this time." : error.message, variant: "destructive" });
      return;
    }
    toast({ title: isClass ? "Class updated" : "Session updated" });
    onSaved();
    onClose();
  };

  const cancel = async () => {
    if (!confirm(isClass ? "Cancel this class for everyone?" : "Cancel this session?")) return;
    setSaving(true);
    const { error } = isClass
      ? await supabase.from("events").update({ status: "cancelled" }).eq("id", item.id)
      : await supabase.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled by club" }).eq("id", item.id);
    setSaving(false);
    if (error) { toast({ title: "Could not cancel", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cancelled" });
    onSaved();
    onClose();
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <p className="font-display text-[10px] tracking-[0.2em] text-primary">{isClass ? "GROUP CLASS" : "PRIVATE SESSION"}</p>
          <SheetTitle className="font-display uppercase tracking-wide">{isClass ? item.title : item.sub || "Session"}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isClass && (
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Coach</Label>
              <select className={selectCls} value={coach} onChange={(e) => setCoach(e.target.value)}>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Court</Label>
              <select className={selectCls} value={court} onChange={(e) => setCourt(e.target.value)}>
                <option value="">No court</option>
                {courts.map((c) => <option key={c.id} value={c.id}>{c.court_number}</option>)}
              </select>
            </div>
          </div>
          {isClass && (
            <div className="space-y-1.5">
              <Label>Max players</Label>
              <Input type="number" min={1} value={max} onChange={(e) => setMax(e.target.value)} placeholder="No limit" />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="animate-spin" size={16} /> : "Save changes"}
            </Button>
            <Button variant="outline" onClick={cancel} disabled={saving} aria-label="Cancel">
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </div>

          {isClass && (
            <div className="pt-4">
              <ClassAttendees
                eventId={item.id}
                canManage
                maxParticipants={item.max ?? null}
                minParticipants={item.min ?? 0}
                levelMin={item.level_min ?? null}
                levelMax={item.level_max ?? null}
                onChanged={onSaved}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CalendarItemSheet;
