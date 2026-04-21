
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { OrderItemsEditor } from './orders/OrderItemsEditor';
import { Input } from '@/components/ui/input';
import { getPaymentStatus, getPayable, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/paymentStatus';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  guardian_status?: string | null;
  child_name?: string | null;
  child_age?: string | null;
  child_birthdate?: string | null;
  payment_method: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid?: number;
  promo_code?: string;
  discount_amount?: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailsDialog = ({ order, isOpen, onClose, onOrderUpdated }: OrderDetailsDialogProps) => {
  const [status, setStatus] = useState(order?.status || 'pending');
  const [updating, setUpdating] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || '');
  const [paymentMethods, setPaymentMethods] = useState<{id: string; bank_name: string}[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(order?.amount_paid || 0);
  const [savingPayment, setSavingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentMethod(order.payment_method);
      setAmountPaid(order.amount_paid || 0);
    }
  }, [order]);

  useEffect(() => {
    if (editingPayment) {
      supabase.from('payment_methods').select('id, bank_name').eq('active', true)
        .then(({ data }) => setPaymentMethods(data || []));
    }
  }, [editingPayment]);

  const handlePaymentMethodUpdate = async () => {
    if (!order || paymentMethod === order.payment_method) return;
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: "Success", description: "Payment method updated successfully" });
      setEditingPayment(false);
      onOrderUpdated();
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update payment method" });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    void 0;
  };

  const handleAmountPaidSave = async () => {
    if (!order) return;
    const safeValue = Math.max(0, Math.floor(amountPaid || 0));
    if (safeValue === (order.amount_paid || 0)) return;
    try {
      setSavingPayment(true);
      const { error } = await supabase
        .from('orders')
        .update({ amount_paid: safeValue, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Payment amount updated' });
      onOrderUpdated();
    } catch (error) {
      console.error('Error updating amount paid:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update payment amount' });
    } finally {
      setSavingPayment(false);
    }
  };

  const _handleStatusUpdate = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);

      // If cancelling, restore stock via RPC
      if (status === 'cancelled') {
        const { error: restoreError } = await supabase
          .rpc('restore_stock_for_order', { p_order_id: order.id });

        if (restoreError) {
          console.error('Stock restoration failed:', restoreError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to restore stock for cancelled order',
          });
          return;
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });

      onOrderUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.id}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm">{order.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{order.customer_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-sm">{order.customer_phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                {editingPayment ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Keep current value as option */}
                        {!paymentMethods.find(pm => pm.bank_name === order.payment_method) && (
                          <SelectItem value={order.payment_method}>{order.payment_method}</SelectItem>
                        )}
                        {paymentMethods.map(pm => (
                          <SelectItem key={pm.id} value={pm.bank_name}>{pm.bank_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handlePaymentMethodUpdate} disabled={updating || paymentMethod === order.payment_method}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingPayment(false); setPaymentMethod(order.payment_method); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.payment_method}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPayment(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {order.customer_address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{order.customer_address}</p>
                </div>
              )}
              {order.guardian_status && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Guardian Status</label>
                  <p className="text-sm">{order.guardian_status}</p>
                </div>
              )}
              {order.child_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Child Name</label>
                  <p className="text-sm">{order.child_name}</p>
                </div>
              )}
              {order.child_birthdate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Child Birthdate</label>
                  <p className="text-sm">{new Date(order.child_birthdate).toLocaleDateString()}</p>
                </div>
              )}
              {order.child_age && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Child Age</label>
                  <p className="text-sm">{order.child_age}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <OrderItemsEditor
            orderId={order.id}
            items={order.items || []}
            currentSubtotal={order.subtotal}
            currentTax={order.tax_amount}
            currentDiscount={order.discount_amount || 0}
            paymentMethod={order.payment_method}
            onSaved={onOrderUpdated}
          />

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.promo_code}):</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Order Management */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Management</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 block mb-2">Update Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={updating || status === order.status}
                className="mt-6"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>

          {/* Order Meta */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>Order ID: {order.id}</p>
            <p>Created: {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
