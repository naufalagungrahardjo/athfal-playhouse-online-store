import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, X, Mail, MailCheck } from "lucide-react";
import { useBillingNotices } from "@/hooks/useBillingNotices";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { generateBillingNoticePdf } from "@/lib/billingNoticePdf";

interface OrderShape {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  child_name?: string | null;
  child_birthdate?: string | null;
  child_age?: string | null;
  child_gender?: string | null;
  guardian_status?: string | null;
}

export const OrderBillingNoticesSection = ({ order }: { order: OrderShape }) => {
  const { notices, assignments, loading, assignToOrders, unassignByOrderAndNotice, setEmailReminder } = useBillingNotices();
  const { payments: paymentMethods } = useSettings();
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const refetchAssignments = async () => {
    // useBillingNotices exposes refetch
  };

  const updateAssignment = async (assignmentId: string, patch: Record<string, any>) => {
    const { error } = await supabase
      .from("billing_notice_assignments")
      .update(patch)
      .eq("id", assignmentId);
    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      return false;
    }
    return true;
  };

  const handlePaymentMethodChange = async (assignmentId: string, method: string) => {
    setUpdatingId(assignmentId);
    const ok = await updateAssignment(assignmentId, { payment_method: method });
    if (ok) toast.success("Payment method updated");
    setUpdatingId(null);
    // trigger refetch
    window.dispatchEvent(new Event("billing-assignments-changed"));
    location.reload();
  };

  const handleStatusChange = async (
    assignmentId: string,
    newStatus: "pending" | "paid",
    notice: { id: string; title: string; amount: number },
    currentMethod: string | null | undefined,
    existingGeneratedOrderId: string | null | undefined,
  ) => {
    if (newStatus === "paid") {
      if (!currentMethod) {
        toast.error("Please select a payment method first before marking as Paid");
        return;
      }
    }
    setUpdatingId(assignmentId);
    try {
      if (newStatus === "paid" && !existingGeneratedOrderId) {
        // Create a new order using customer details from parent order + billing as product
        const newOrderId = crypto.randomUUID();
        const { error: orderErr } = await supabase.from("orders").insert({
          id: newOrderId,
          user_id: null,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone || "",
          customer_address: order.customer_address || null,
          guardian_status: order.guardian_status || null,
          child_name: order.child_name || null,
          child_birthdate: order.child_birthdate || null,
          child_age: order.child_age || null,
          child_gender: order.child_gender || null,
          payment_method: currentMethod!,
          notes: `[Billing Payment] ${notice.title} (notice ${notice.id})`,
          subtotal: notice.amount,
          tax_amount: 0,
          total_amount: notice.amount,
          status: "completed",
          stock_deducted: true,
        });
        if (orderErr) {
          toast.error(`Failed to create order: ${orderErr.message}`);
          setUpdatingId(null);
          return;
        }
        const { error: itemErr } = await supabase.from("order_items").insert({
          order_id: newOrderId,
          product_id: `billing_${notice.id}`,
          product_name: notice.title,
          product_price: notice.amount,
          quantity: 1,
        });
        if (itemErr) {
          toast.error(`Order created but item failed: ${itemErr.message}`);
        }
        // MDR expense
        try {
          await supabase.rpc("create_mdr_expense_for_order" as any, { p_order_id: newOrderId });
        } catch (e) {
          // non-blocking
        }
        await updateAssignment(assignmentId, {
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          generated_order_id: newOrderId,
        });
        toast.success("Marked Paid; new order created");
      } else {
        await updateAssignment(assignmentId, {
          payment_status: newStatus,
          ...(newStatus === "pending" ? { paid_at: null } : {}),
        });
        toast.success(`Status set to ${newStatus}`);
      }
    } finally {
      setUpdatingId(null);
      location.reload();
    }
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
                    <Badge variant={a.payment_status === "paid" ? "default" : "outline"}>
                      {(a.payment_status || "pending").toUpperCase()}
                    </Badge>
                  </div>
                  {n.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.description}</p>}
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <div className="min-w-[180px]">
                      <Select
                        value={a.payment_method || ""}
                        onValueChange={(v) => handlePaymentMethodChange(a.id, v)}
                        disabled={updatingId === a.id || a.payment_status === "paid"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.filter((p: any) => p.active).map((p: any) => {
                            const label = p.bank || p.bank_name;
                            return (
                              <SelectItem key={p.id || label} value={label}>{label}</SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[140px]">
                      <Select
                        value={a.payment_status || "pending"}
                        onValueChange={(v) => handleStatusChange(a.id, v as "pending" | "paid", n, a.payment_method, a.generated_order_id)}
                        disabled={updatingId === a.id}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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