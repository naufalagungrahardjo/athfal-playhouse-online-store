
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

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
  payment_method: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
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
  const { toast } = useToast();

  const handleStatusUpdate = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
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
        return 'bg-red-100 text-red-800';
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
                <p className="text-sm">{order.payment_method}</p>
              </div>
              {order.customer_address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{order.customer_address}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Product ID: {item.product_id}</p>
                      <p className="text-sm text-gray-500">Price: {formatCurrency(item.product_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-500">
                        Total: {formatCurrency(item.product_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No items found for this order</p>
              )}
            </div>
          </div>

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
