import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, X, Mail, MailCheck } from "lucide-react";
import { useBillingNotices } from "@/hooks/useBillingNotices";
import { formatCurrency } from "@/lib/utils";
import { generateBillingNoticePdf } from "@/lib/billingNoticePdf";

interface OrderShape {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;
}

export const OrderBillingNoticesSection = ({ order }: { order: OrderShape }) => {
  const { notices, assignments, loading, assignToOrders, unassignByOrderAndNotice, setEmailReminder } = useBillingNotices();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const assigned = useMemo(
    () => assignments.filter((a) => a.order_id === order.id),
    [assignments, order.id]
  );
  const assignedIds = new Set(assigned.map((a) => a.notice_id));
  const available = notices.filter((n) => !assignedIds.has(n.id));

  const noticeById = useMemo(() => {
    const m = new Map(notices.map((n) => [n.id, n]));
    return m;
  }, [notices]);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    await assignToOrders(selected, [order.id]);
    setSelected("");
    setSaving(false);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Billing Notices</h3>
      <div className="flex items-end gap-2 mb-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder={available.length ? "Select a notice to assign" : "No more notices to assign"} />
            </SelectTrigger>
            <SelectContent>
              {available.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.title} — {formatCurrency(n.amount)} (due {new Date(n.due_date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAssign} disabled={!selected || saving}>
          <Plus className="h-4 w-4 mr-1" /> Assign
        </Button>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : assigned.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No billing notices assigned to this order.</p>
      ) : (
        <ul className="space-y-2">
          {assigned.map((a) => {
            const n = noticeById.get(a.notice_id);
            if (!n) return null;
            return (
              <li key={a.id} className="border rounded p-3 bg-white flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center mt-1">
                    <Badge variant="secondary">Due {new Date(n.due_date).toLocaleDateString()}</Badge>
                    <span className="font-semibold text-foreground">{formatCurrency(n.amount)}</span>
                  </div>
                  {n.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => generateBillingNoticePdf({ notice: n, order })}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant={a.email_reminder_enabled ? "default" : "outline"}
                    disabled={togglingId === a.id}
                    onClick={async () => {
                      setTogglingId(a.id);
                      await setEmailReminder(a.id, !a.email_reminder_enabled);
                      setTogglingId(null);
                    }}
                    title={a.email_reminder_enabled
                      ? `Reminder will be sent to ${order.customer_email} at the billing due date and time${a.email_reminder_sent_at ? ` (sent ${new Date(a.email_reminder_sent_at).toLocaleString()})` : ""}`
                      : `Send email reminder to ${order.customer_email} at the billing due date and time`}
                  >
                    {a.email_reminder_sent_at ? <MailCheck className="h-4 w-4 mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                    {a.email_reminder_enabled ? (a.email_reminder_sent_at ? "Sent" : "Reminder On") : "Email on Due"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => unassignByOrderAndNotice(n.id, order.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};