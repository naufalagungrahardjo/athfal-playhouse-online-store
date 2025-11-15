import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/utils/logAdminAction';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  payment_method: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
  discount_amount?: number | null;
  promo_code?: string | null;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders from database...');
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      console.log('Orders fetched:', ordersData);

      // Fetch order items for each order
      const ordersWithItems: Order[] = [];
      
      for (const order of ordersData || []) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          console.error('Order items fetch error:', itemsError);
          // Continue without items if there's an error
        }

        ordersWithItems.push({
          ...order,
          items: itemsData || []
        });
      }

      console.log('Orders with items:', ordersWithItems);
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders"
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      // 1) Load current order (including stock_deducted flag)
      const { data: order, error: orderFetchError }: any = await supabase
        .from('orders')
        .select('id, status, stock_deducted')
        .eq('id', orderId)
        .single();

      if (orderFetchError) throw orderFetchError;

      // 2) If moving to processing AND stock has not yet been deducted, decrement product stocks
      const shouldDeductStock = status === 'processing' && order && !order.stock_deducted;

      if (shouldDeductStock) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        for (const item of items || []) {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock, product_id')
            .eq('product_id', item.product_id)
            .single();

          if (productError) {
            console.error('Product fetch error:', item.product_id, productError);
            continue;
          }

          const newStock = Math.max(0, (product?.stock ?? 0) - item.quantity);
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('product_id', item.product_id);

          if (updateError) {
            console.error('Product stock update error:', item.product_id, updateError);
          }
        }
      }

      // 3) Update order status (and mark stock_deducted if we just deducted)
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (shouldDeductStock) {
        updatePayload.stock_deducted = true;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });

      await logAdminAction({
        user,
        action: `Updated order status to "${status}" (order id: ${orderId})`,
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status',
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast({
        title: "Success",
        description: "Order deleted successfully"
      });

      await logAdminAction({
        user,
        action: `Deleted order (order id: ${orderId})`,
      });

      await fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete order"
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    fetchOrders,
    updateOrderStatus,
    deleteOrder
  };
};
