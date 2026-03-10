import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAction } from '@/utils/logAdminAction';
import { logger } from '@/utils/logger';

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
      logger.log('Fetching orders from database...');
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      // Batch fetch all order items in a single query
      const orderIds = (ordersData || []).map(o => o.id);
      let allItems: any[] = [];

      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) {
          logger.error('Order items batch fetch error:', itemsError);
        } else {
          allItems = itemsData || [];
        }
      }

      // Map items to their orders in memory
      const itemsByOrderId = new Map<string, OrderItem[]>();
      for (const item of allItems) {
        const existing = itemsByOrderId.get(item.order_id) || [];
        existing.push(item);
        itemsByOrderId.set(item.order_id, existing);
      }

      const ordersWithItems: Order[] = (ordersData || []).map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
      }));

      logger.log('Orders fetched:', ordersWithItems.length);
      setOrders(ordersWithItems);
    } catch (error) {
      logger.error('Error fetching orders:', error);
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
      const currentOrder = orders.find(o => o.id === orderId);
      const previousStatus = currentOrder?.status;

      // If cancelling, restore stock via RPC
      if (status === 'cancelled') {
        const { error: restoreError } = await supabase
          .rpc('restore_stock_for_order', { p_order_id: orderId });

        if (restoreError) {
          logger.error('Stock restoration failed:', restoreError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to restore stock for cancelled order',
          });
          return;
        }
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // Auto-create MDR expense as fallback when order moves to "completed" (deduplicated via RPC)
      if (status === 'completed' && previousStatus !== 'completed') {
        try {
          await supabase.rpc('create_mdr_expense_for_order' as any, { p_order_id: orderId });
        } catch (mdrErr) {
          logger.error('MDR expense fallback failed (non-blocking):', mdrErr);
        }
      }

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
      logger.error('Error updating order status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status',
      });
    }
  };

  // Create MDR expense based on payment method's MDR rate (with dedup check)
  const createMdrExpense = async (order: Order) => {
    try {
      // Check if MDR expense already exists for this order
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id')
        .like('description', `MDR Fee - Order #${order.id.slice(0, 8)}%`)
        .maybeSingle();

      if (existingExpense) {
        logger.log('MDR expense already exists for this order, skipping');
        return;
      }

      // Get payment method with MDR rate
      const { data: paymentMethod, error: pmError } = await supabase
        .from('payment_methods')
        .select('bank_name, mdr_rate')
        .eq('bank_name', order.payment_method)
        .maybeSingle();

      if (pmError) {
        logger.error('Error fetching payment method for MDR:', pmError);
        return;
      }

      const mdrRate = (paymentMethod as any)?.mdr_rate ?? 0;
      if (mdrRate <= 0) {
        logger.log('No MDR rate set for this payment method, skipping');
        return;
      }

      const mdrAmount = Math.round((order.total_amount * mdrRate) / 100);
      if (mdrAmount <= 0) return;

      // Get or create "MDR Fee" expense category
      let categoryId: string | null = null;
      const { data: existingCategory } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', 'MDR Fee')
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory, error: catError } = await supabase
          .from('expense_categories')
          .insert({ name: 'MDR Fee' })
          .select('id')
          .single();
        if (!catError && newCategory) categoryId = newCategory.id;
      }

      // Get or create fund source matching the payment method
      let fundSourceId: string | null = null;
      const { data: existingSource } = await supabase
        .from('expense_fund_sources')
        .select('id')
        .eq('name', order.payment_method)
        .maybeSingle();

      if (existingSource) {
        fundSourceId = existingSource.id;
      } else {
        const { data: newSource, error: srcError } = await supabase
          .from('expense_fund_sources')
          .insert({ name: order.payment_method })
          .select('id')
          .single();
        if (!srcError && newSource) fundSourceId = newSource.id;
      }

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          description: `MDR Fee - Order #${order.id.slice(0, 8)} (${mdrRate}%)`,
          amount: mdrAmount,
          category_id: categoryId,
          fund_source_id: fundSourceId,
          date: new Date().toISOString().split('T')[0],
        });

      if (expenseError) {
        logger.error('Error creating MDR expense:', expenseError);
      } else {
        logger.log(`MDR expense created: Rp ${mdrAmount} (${mdrRate}% of ${order.total_amount})`);
      }
    } catch (error) {
      logger.error('Error in createMdrExpense:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // Restore stock before deleting if it was deducted
      const { error: restoreError } = await supabase
        .rpc('restore_stock_for_order', { p_order_id: orderId });

      if (restoreError) {
        logger.error('Stock restoration failed before delete:', restoreError);
        // Continue with deletion even if restore fails (RPC handles already-restored case)
      }

      // Delete order items first
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
      logger.error('Error deleting order:', error);
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
