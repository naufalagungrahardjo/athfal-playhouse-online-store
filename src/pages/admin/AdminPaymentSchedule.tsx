import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { Search, Mail, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentRow {
  id: string;
  order_id: string;
  payment_number: number;
  amount: number;
  due_date: string | null;
  status: string;
  paid_at: string | null;
  last_reminder_sent_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

const AdminPaymentSchedule = () => {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming' | 'paid'>('all');
  const { toast } = useToast();

  const fetch = async () => {
    setLoading(true);
    const { data: payments } = await supabase
      .from('order_payments' as any)
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false });
    if (!payments) { setRows([]); setLoading(false); return; }
    const orderIds = [...new Set((payments as any[]).map(p => p.order_id))];
    const { data: orders } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email, customer_phone')
      .in('id', orderIds);
    const orderMap = new Map((orders || []).map(o => [o.id, o]));
    setRows((payments as any[]).map(p => ({
      ...p,
      customer_name: orderMap.get(p.order_id)?.customer_name || '',
      customer_email: orderMap.get(p.order_id)?.customer_email || '',
      customer_phone: orderMap.get(p.order_id)?.customer_phone || '',
    })));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const isOverdue = r.status === 'unpaid' && r.due_date && isPast(parseISO(r.due_date));
      if (filter === 'overdue' && !isOverdue) return false;
      if (filter === 'upcoming' && (r.status === 'paid' || isOverdue)) return false;
      if (filter === 'paid' && r.status !== 'paid') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.customer_name.toLowerCase().includes(q) && !r.customer_email.toLowerCase().includes(q) && !r.order_id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, search]);

  const totals = useMemo(() => ({
    overdue: rows.filter(r => r.status === 'unpaid' && r.due_date && isPast(parseISO(r.due_date))).reduce((s, r) => s + r.amount, 0),
    upcoming: rows.filter(r => r.status === 'unpaid' && (!r.due_date || !isPast(parseISO(r.due_date)))).reduce((s, r) => s + r.amount, 0),
    paid: rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
  }), [rows]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from('order_payments' as any).update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    toast({ title: 'Marked as paid' });
    fetch();
  };

  const sendReminder = async (orderId: string, paymentId: string) => {
    const { error } = await supabase.functions.invoke('send-payment-reminders', { body: { order_id: orderId, payment_id: paymentId, manual: true } });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }
    toast({ title: 'Reminder sent' });
    fetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Schedule</h1>
        <p className="text-muted-foreground text-sm">All installment payments — due dates, amounts, and customers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{formatCurrency(totals.overdue)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Upcoming</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totals.upcoming)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Paid (All Time)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customer or order ID…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1">
          {(['all', 'overdue', 'upcoming', 'paid'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payments match your filters.</div>
        ) : (
          <div className="divide-y">
            {filtered.map(r => {
              const isOverdue = r.status === 'unpaid' && r.due_date && isPast(parseISO(r.due_date));
              return (
                <div key={r.id} className={`p-4 flex flex-col md:flex-row md:items-center gap-3 ${isOverdue ? 'bg-destructive/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.customer_name}</span>
                      <Badge variant="outline">Payment #{r.payment_number}</Badge>
                      <Badge className={r.status === 'paid' ? 'bg-green-500' : ''} variant={r.status === 'paid' ? 'default' : 'outline'}>{r.status.toUpperCase()}</Badge>
                      {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.customer_email} · {r.customer_phone}</p>
                    <p className="text-xs text-muted-foreground truncate">Order: {r.order_id.slice(0, 8)}…</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(r.amount)}</p>
                    <p className="text-xs text-muted-foreground">Due: {r.due_date ? format(parseISO(r.due_date), 'PP') : '—'}</p>
                  </div>
                  <div className="flex gap-1">
                    {r.status === 'unpaid' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => sendReminder(r.order_id, r.id)}>
                          <Mail className="h-3 w-3 mr-1" />Remind
                        </Button>
                        <Button size="sm" onClick={() => markPaid(r.id)}>
                          <Check className="h-3 w-3 mr-1" />Mark Paid
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentSchedule;
