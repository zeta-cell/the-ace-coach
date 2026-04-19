import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCrmOwner } from "@/hooks/useCrmOwner";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; onImported: () => void; }

interface ParsedRow { full_name: string; email: string | null; phone: string | null; notes: string | null; }

const parseCsv = (text: string): { rows: ParsedRow[]; errors: string[] } => {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ["Empty file"] };

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.findIndex((h) => h === "name" || h === "full_name" || h === "full name");
  const emailIdx = headers.findIndex((h) => h === "email");
  const phoneIdx = headers.findIndex((h) => h === "phone" || h === "phone_number");
  const notesIdx = headers.findIndex((h) => h === "notes" || h === "note");

  if (nameIdx === -1) {
    errors.push("CSV must have a 'name' or 'full_name' column.");
    return { rows: [], errors };
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    if (!name) continue;
    rows.push({
      full_name: name,
      email: emailIdx >= 0 ? cols[emailIdx]?.trim() || null : null,
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || null : null,
      notes: notesIdx >= 0 ? cols[notesIdx]?.trim() || null : null,
    });
  }

  return { rows, errors };
};

const CsvImportDialog = ({ open, onClose, onImported }: Props) => {
  const { ownerId, ownerType } = useCrmOwner();
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const { rows, errors } = parseCsv(text);
    setParsed(rows);
    setErrors(errors);
  };

  const handleImport = async () => {
    if (!ownerId || parsed.length === 0) return;
    setImporting(true);
    const records = parsed.map((r) => ({
      owner_id: ownerId,
      owner_type: ownerType,
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      notes: r.notes,
      source: "csv_import",
      pipeline_stage: "lead",
    }));
    const { error } = await supabase.from("crm_clients").insert(records);
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${records.length} client${records.length > 1 ? "s" : ""}`);
    setParsed([]); setErrors([]); setFileName(null);
    onImported();
    onClose();
  };

  const reset = () => { setParsed([]); setErrors([]); setFileName(null); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <FileText className="mx-auto text-muted-foreground mb-2" size={28} />
            <p className="text-xs text-muted-foreground mb-3">
              CSV with columns: <span className="font-mono text-foreground">name, email, phone, notes</span>
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider cursor-pointer hover:bg-primary/90 transition-colors">
              <Upload size={14} />
              {fileName ? "CHOOSE DIFFERENT FILE" : "SELECT CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              />
            </label>
            {fileName && <p className="text-xs text-muted-foreground mt-2">{fileName}</p>}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex gap-2">
              <AlertCircle className="text-destructive shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-destructive space-y-1">
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            </div>
          )}

          {parsed.length > 0 && (
            <div className="rounded-lg bg-secondary/30 border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-emerald-500" size={16} />
                <span className="text-sm font-body text-foreground">Found {parsed.length} clients</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsed.slice(0, 10).map((r, i) => (
                  <div key={i} className="text-xs text-muted-foreground truncate">
                    {r.full_name} {r.email && `· ${r.email}`}
                  </div>
                ))}
                {parsed.length > 10 && <div className="text-xs text-muted-foreground italic">…and {parsed.length - 10} more</div>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleImport} disabled={parsed.length === 0 || importing}>
            {importing ? "Importing…" : `Import ${parsed.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImportDialog;
