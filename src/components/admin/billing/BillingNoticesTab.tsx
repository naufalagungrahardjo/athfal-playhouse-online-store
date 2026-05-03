import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, UserPlus, Download, X } from "lucide-react";
import { useBillingNotices, BillingNotice } from "@/hooks/useBillingNotices";
import { BillingNoticeFormDialog } from "./BillingNoticeFormDialog";
import { AssignOrdersDialog } from "./AssignOrdersDialog";
import { formatCurrency } from "@/lib/utils";
import { generateBillingNoticePdf } from "@/lib/billingNoticePdf";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRole } from "@/pages/admin/helpers/getAdminRole";

interface Props {
  orders: any[];
}

export const BillingNoticesTab = ({ orders }: Props) => {
  const { notices, assignments, loading, createNotice, updateNotice, deleteNotice, assignToOrders, unassign } = useBillingNotices();
  const { user } = useAuth();
  const role = getAdminRole(user);
  const canDelete = role === "super_admin" || role === "orders_manager";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BillingNotice | null>(null);
  const [assignOpen, setAssignOpen] = useState<BillingNotice | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const ordersById = useMemo(() => {
    const m = new Map<string, any>();
    orders.forEach((o) => m.set(o.id, o));
    return m;
  }, [orders]);

  const assignmentsByNotice = useMemo(() => {
    const m = new Map<string, typeof assignments>();
    assignments.forEach((a) => {
      if (!m.has(a.notice_id)) m.set(a.notice_id, []);
      m.get(a.notice_id)!.push(a);
    });
    return m;
  }, [assignments]);

  const handleDownload = (notice: BillingNotice, orderId: string) => {
    const order = ordersById.get(orderId);
    if (!order) return;
    generateBillingNoticePdf({ notice, order });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Billing Notices</h2>
          <p className="text-sm text-muted-foreground">Create future billing notices and assign them to customer orders.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Notice
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading notices...</p>
      ) : notices.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No billing notices yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => {
            const list = assignmentsByNotice.get(n.id) || [];
            const isOpen = expanded === n.id;
            return (
              <Card key={n.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{n.title}</h3>
                        <Badge variant="secondary">Due {new Date(n.due_date).toLocaleDateString()}</Badge>
                        <Badge>{list.length} assigned</Badge>
                      </div>
                      <p className="text-lg font-bold mt-1">{formatCurrency(n.amount)}</p>
                      {n.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.description}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setAssignOpen(n)}>
                        <UserPlus className="h-4 w-4 mr-1" /> Assign
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(n); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button size="sm" variant="outline" onClick={() => {
                          if (confirm(`Delete notice "${n.title}"? This will also remove all assignments.`)) deleteNotice(n.id);
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : n.id)}>
                        {isOpen ? "Hide" : "View"} customers
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t pt-3">
                      {list.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No customers assigned yet.</p>
                      ) : (
                        <ul className="divide-y">
                          {list.map((a) => {
                            const order = ordersById.get(a.order_id);
                            return (
                              <li key={a.id} className="flex items-center justify-between py-2 gap-2 flex-wrap">
                                <div className="text-sm">
                                  <div className="font-medium">{order?.customer_name || "(unknown order)"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {order?.customer_email} · Order {a.order_id.slice(0, 8)}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" disabled={!order} onClick={() => order && handleDownload(n, a.order_id)}>
                                    <Download className="h-4 w-4 mr-1" /> PDF
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => unassign(a.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BillingNoticeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSave={async (input) => {
          if (editing) await updateNotice(editing.id, input);
          else await createNotice(input);
        }}
      />

      {assignOpen && (
        <AssignOrdersDialog
          open={!!assignOpen}
          onClose={() => setAssignOpen(null)}
          orders={orders}
          alreadyAssigned={new Set((assignmentsByNotice.get(assignOpen.id) || []).map((a) => a.order_id))}
          onConfirm={(ids) => assignToOrders(assignOpen.id, ids)}
        />
      )}
    </div>
  );
};