import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PayableRow {
  paymentId: string;
  orderId: string;
  paymentNumber: number;
  amount: number;
  divisionLabel: string;
  productName: string;
  customerName: string;
  studentName: string;
  phone: string;
  orderStatus: string;
}

interface Props {
  orders: any[];
  onViewDetails: (order: any) => void;
  refreshKey?: number;
  onChanged?: () => void;
}

export const ListOfPayableTab = ({ orders, onViewDetails, refreshKey = 0, onChanged }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PayableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const orderMap = useMemo(() => {
    const m = new Map<string, any>();
    orders.forEach((o) => m.set(o.id, o));
    return m;
  }, [orders]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('order_payments')
      .select('id, order_id, payment_number, amount, notes, status')
      .eq('status', 'unpaid')
      .order('payment_number', { ascending: true });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setLoading(false);
      return;
    }
    const built: PayableRow[] = (data || [])
      .map((p) => {
        const order = orderMap.get(p.order_id);
        if (!order) return null;
        if (order.status === 'cancelled' || order.status === 'refund') return null;
        const amount = Number(p.amount) || 0;
        // Skip zero/negative adjustment rows — nothing is actually owed.
        if (amount <= 0) return null;
        // Skip orders that are already settled in full (leftover legacy rows
        // can stay "unpaid" even though the money was received).
        const total = Number(order.total_amount) || 0;
        const paid = Number(order.amount_paid) || 0;
        if (total > 0 && paid >= total) return null;
        const productName =
          order.items?.map((i: any) => i.product_name).filter(Boolean).join(', ') || '-';
        return {

          paymentId: p.id,
          orderId: p.order_id,
          paymentNumber: p.payment_number,
          amount: Number(p.amount) || 0,
          divisionLabel: p.notes || `Pembayaran ${p.payment_number}`,
          productName,
          customerName: order.customer_name || '-',
          studentName: order.child_name || '-',
          phone: order.customer_phone || '-',
          orderStatus: order.status,
        } as PayableRow;
      })
      .filter(Boolean) as PayableRow[];
    setRows(built);
    setLoading(false);
  };

  useEffect(() => {
    if (orders.length === 0) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderMap, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.productName, r.customerName, r.studentName, r.phone, r.divisionLabel, String(r.amount)]
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const handleSwitch = (row: PayableRow) => {
    setPendingId(row.paymentId);
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const paymentId = pendingId;
    setPendingId(null);
    if (!file || !paymentId) return;
    const row = rows.find((r) => r.paymentId === paymentId);
    if (!row) return;
    try {
      setBusyId(paymentId);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `payment-evidence/${row.orderId}/${paymentId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true, cacheControl: '31536000', contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);

      const { error } = await supabase
        .from('order_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          evidence_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);
      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.paymentId !== paymentId));
      toast({ title: 'Success', description: 'Payment division marked as paid' });
      onChanged?.();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to update payment' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search product, customer, student, phone, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Payment Division</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Paid</TableHead>
                <TableHead className="text-center">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No pending payment divisions</TableCell></TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.paymentId}>
                    <TableCell className="max-w-[220px] whitespace-normal">{r.productName}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell>{r.studentName}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">{r.divisionLabel}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(r.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={false}
                        disabled={busyId === r.paymentId}
                        onCheckedChange={() => handleSwitch(r)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const order = orderMap.get(r.orderId);
                          if (order) onViewDetails(order);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filtered.length > 0 && (
              <tfoot>
                <TableRow>
                  <TableCell colSpan={5} className="font-semibold">Total outstanding ({filtered.length})</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Turning a toggle on here requires payment evidence and instantly marks the same division as paid in Order Management (and vice versa).
      </p>
    </div>
  );
};
