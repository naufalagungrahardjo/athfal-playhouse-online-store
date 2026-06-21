import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const isManualOrder = (o: any) =>
  typeof o.notes === 'string' && o.notes.startsWith('[Manual Order]');

const cleanNote = (notes: string | null | undefined) => {
  if (!notes) return '';
  return notes.replace(/^\[Manual Order\]\s*/, '').trim();
};

const HistoryManualOrderTab = () => {
  const { orders, loading, fetchOrders } = useOrders();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmedOverrides, setConfirmedOverrides] = useState<Record<string, boolean>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});

  const isConfirmed = (o: any) => confirmedOverrides[o.id] ?? !!o.payment_confirmed;

  const togglePaymentConfirmed = async (o: any, value: boolean) => {
    setConfirmedOverrides((prev) => ({ ...prev, [o.id]: value }));
    const { error } = await supabase
      .from('orders')
      .update({ payment_confirmed: value })
      .eq('id', o.id);
    if (error) {
      setConfirmedOverrides((prev) => ({ ...prev, [o.id]: !value }));
      toast.error('Failed to update payment confirmation');
    }
  };

  const getNote = (o: any) => noteOverrides[o.id] ?? (o.payment_note || '');

  const updatePaymentNote = async (o: any, value: string) => {
    setNoteOverrides((prev) => ({ ...prev, [o.id]: value }));
    const { error } = await supabase
      .from('orders')
      .update({ payment_note: value })
      .eq('id', o.id);
    if (error) {
      toast.error('Failed to save payment note');
    }
  };

  const manualOrders = useMemo(() => {
    const list = (orders || []).filter(isManualOrder);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return manualOrders;
    return manualOrders.filter((o) => {
      const fields = [
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.payment_method,
        o.status,
        cleanNote(o.notes),
        ...(o.items || []).map((it: any) => it.product_name || ''),
      ];
      return fields.some((v) => v != null && String(v).toLowerCase().includes(q));
    });
  }, [manualOrders, search]);

  const handleView = (o: any) => {
    setSelectedOrder(o);
    setIsDetailsOpen(true);
  };
  const handleClose = () => {
    setSelectedOrder(null);
    setIsDetailsOpen(false);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>History Manual Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by customer, product, order ID, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Badge variant="secondary">Total Manual Orders: {filtered.length}</Badge>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No manual orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Created Date</TableHead>
                    <TableHead className="whitespace-nowrap">Transaction Date</TableHead>
                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                    <TableHead className="whitespace-nowrap">Products</TableHead>
                    <TableHead className="whitespace-nowrap">Payment</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} className="bg-green-50 hover:bg-green-100">
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(o.created_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {o.transaction_date
                          ? new Date(o.transaction_date).toLocaleDateString('id-ID')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{o.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="text-sm">
                          {(o.items || [])
                            .map((it: any) => `${it.product_name} (x${it.quantity})`)
                            .join(', ') || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{o.payment_method}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="capitalize">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatCurrency(o.total_amount || 0)}
                      <label className="mt-1 flex items-center justify-end gap-1.5 cursor-pointer font-normal">
                        <Checkbox
                          checked={isConfirmed(o)}
                          onCheckedChange={(v) => togglePaymentConfirmed(o, v === true)}
                        />
                        <span className="text-[11px] text-muted-foreground">Payment confirmed</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Payment note..."
                        value={getNote(o)}
                        onChange={(e) => setNoteOverrides((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        onBlur={(e) => updatePaymentNote(o, e.target.value)}
                        className="mt-1 h-6 text-[11px] px-1.5 py-0 w-[140px] ml-auto"
                      />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleView(o)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && selectedOrder.id && (
        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={handleClose}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
};

export default HistoryManualOrderTab;