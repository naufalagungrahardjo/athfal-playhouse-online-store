import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

interface OrderLite {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  orders: OrderLite[];
  alreadyAssigned: Set<string>;
  onConfirm: (orderIds: string[]) => Promise<unknown>;
}

export const AssignOrdersDialog = ({ open, onClose, orders, alreadyAssigned, onConfirm }: Props) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (alreadyAssigned.has(o.id)) return false;
      if (!q) return true;
      return [o.id, o.customer_name, o.customer_email].some((v) => v && String(v).toLowerCase().includes(q));
    });
  }, [orders, query, alreadyAssigned]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selected.size) return;
    setSaving(true);
    await onConfirm(Array.from(selected));
    setSaving(false);
    setSelected(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign to Customer Orders</DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input className="pl-10" placeholder="Search by customer, email, or order id..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="border rounded divide-y max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No matching orders.</p>
          )}
          {filtered.map((o) => (
            <label key={o.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
              <div className="flex-1 text-sm">
                <div className="font-medium">{o.customer_name} <span className="text-muted-foreground">· {o.customer_email}</span></div>
                <div className="text-xs text-muted-foreground">Order {o.id.slice(0, 8)} · {o.status} · {new Date(o.created_at).toLocaleDateString()}</div>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !selected.size}>
            {saving ? "Assigning..." : `Assign ${selected.size || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};