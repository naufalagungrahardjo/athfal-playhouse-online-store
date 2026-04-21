import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Check, X, Calendar as CalIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useOrderPayments } from '@/hooks/useOrderPayments';

interface Props {
  orderId: string;
  orderTotal: number;
  onUpdated?: () => void;
}

export const PaymentScheduleEditor = ({ orderId, orderTotal, onUpdated }: Props) => {
  const { payments, loading, refetch } = useOrderPayments(orderId);
  const { toast } = useToast();
  const [editing, setEditing] = useState<Record<string, { amount: number; due_date: string }>>({});

  useEffect(() => {
    const m: Record<string, { amount: number; due_date: string }> = {};
    payments.forEach(p => {
      m[p.id] = { amount: p.amount, due_date: p.due_date || '' };
    });
    setEditing(m);
  }, [payments]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalScheduled = payments.reduce((s, p) => s + p.amount, 0);
  const remainder = orderTotal - totalScheduled;

  const updatePayment = async (id: string, patch: Partial<{ amount: number; due_date: string | null; status: 'paid' | 'unpaid' }>) => {
    const updates: any = { ...patch };
    if (patch.status === 'paid') updates.paid_at = new Date().toISOString();
    if (patch.status === 'unpaid') updates.paid_at = null;
    const { error } = await supabase.from('order_payments' as any).update(updates).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    toast({ title: 'Saved' });
    await refetch();
    onUpdated?.();
  };

  const addPayment = async () => {
    const next = (payments[payments.length - 1]?.payment_number || 0) + 1;
    const { error } = await supabase.from('order_payments' as any).insert({
      order_id: orderId,
      payment_number: next,
      amount: Math.max(0, remainder),
      status: 'unpaid',
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    await refetch();
    onUpdated?.();
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Delete this payment row?')) return;
    const { error } = await supabase.from('order_payments' as any).delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    await refetch();
    onUpdated?.();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading payments…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Total Scheduled: {formatCurrency(totalScheduled)} / {formatCurrency(orderTotal)}</p>
          <p className="text-xs text-muted-foreground">Total Paid: {formatCurrency(totalPaid)} · Outstanding: {formatCurrency(Math.max(0, orderTotal - totalPaid))}</p>
        </div>
        <Button size="sm" variant="outline" onClick={addPayment}><Plus className="h-3 w-3 mr-1" />Add Payment</Button>
      </div>

      {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments scheduled.</p>}

      <div className="space-y-2">
        {payments.map(p => {
          const e = editing[p.id] || { amount: p.amount, due_date: p.due_date || '' };
          const isOverdue = p.status === 'unpaid' && p.due_date && new Date(p.due_date) < new Date();
          return (
            <div key={p.id} className={`border rounded-lg p-3 ${isOverdue ? 'border-destructive bg-destructive/5' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Payment #{p.payment_number}</span>
                  <Badge variant={p.status === 'paid' ? 'default' : 'outline'} className={p.status === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}>
                    {p.status.toUpperCase()}
                  </Badge>
                  {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {p.status === 'unpaid' ? (
                    <Button size="sm" variant="outline" onClick={() => updatePayment(p.id, { status: 'paid' })}>
                      <Check className="h-3 w-3 mr-1" />Mark Paid
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => updatePayment(p.id, { status: 'unpaid' })}>
                      <X className="h-3 w-3 mr-1" />Mark Unpaid
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => deletePayment(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <div className="flex gap-1">
                    <Input type="number" min="0" value={e.amount} onChange={ev => setEditing({ ...editing, [p.id]: { ...e, amount: Number(ev.target.value) } })} />
                    <Button size="sm" variant="outline" onClick={() => updatePayment(p.id, { amount: e.amount })} disabled={e.amount === p.amount}>Save</Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Due Date {p.payment_number === 1 ? '(optional)' : ''}</label>
                  <div className="flex gap-1">
                    <Input type="date" value={e.due_date} onChange={ev => setEditing({ ...editing, [p.id]: { ...e, due_date: ev.target.value } })} />
                    <Button size="sm" variant="outline" onClick={() => updatePayment(p.id, { due_date: e.due_date || null })} disabled={e.due_date === (p.due_date || '')}>Save</Button>
                  </div>
                </div>
              </div>
              {p.last_reminder_sent_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  📧 Last reminder sent: {format(new Date(p.last_reminder_sent_at), 'PPp')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
