import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BillingNotice } from "@/hooks/useBillingNotices";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: BillingNotice | null;
  onSave: (input: { title: string; amount: number; due_date: string; due_at: string | null; send_at: string | null; description: string | null }) => Promise<unknown>;
}

export const BillingNoticeFormDialog = ({ open, onClose, initial, onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [sendDate, setSendDate] = useState<Date | undefined>(undefined);
  const [sendTime, setSendTime] = useState<string>("06:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setAmount(initial?.amount || 0);
      setDueDate(initial?.due_date ? new Date(initial.due_date) : undefined);
      const sendAt = ((initial as any)?.send_at || (initial as any)?.due_at) as string | null | undefined;
      if (sendAt) {
        const d = new Date(sendAt);
        setSendDate(d);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setSendTime(`${hh}:${mm}`);
      } else {
        setSendDate(initial?.due_date ? new Date(initial.due_date) : undefined);
        setSendTime("06:00");
      }
      setDescription(initial?.description || "");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate || !sendDate || amount <= 0) return;
    setSaving(true);
    const [h, m] = sendTime.split(":").map((s) => parseInt(s, 10));
    const sendCombined = new Date(sendDate);
    sendCombined.setHours(isNaN(h) ? 6 : h, isNaN(m) ? 0 : m, 0, 0);
    await onSave({
      title: title.trim(),
      amount: Math.round(amount),
      due_date: format(dueDate, "yyyy-MM-dd"),
      due_at: null,
      send_at: sendCombined.toISOString(),
      description: description.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Billing Notice" : "Create Billing Notice"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pelunasan Bumi Vol. D" />
          </div>
          <div>
            <Label>Amount (IDR)</Label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="text-sm font-semibold text-foreground">Billing Due Date</div>
            <p className="text-xs text-muted-foreground">The payment deadline shown to the customer in the email.</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="text-sm font-semibold text-foreground">Send Reminder Email On</div>
            <p className="text-xs text-muted-foreground">When the reminder email is actually sent (your local time). Can differ from the due date.</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !sendDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sendDate ? format(sendDate, "PPP") : <span>Pick a send date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={sendDate} onSelect={setSendDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <div>
              <Label className="text-xs">Send Time</Label>
              <Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Optional details shown to the customer" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || !dueDate || !sendDate || amount <= 0}>
            {saving ? "Saving..." : (initial ? "Save Changes" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};