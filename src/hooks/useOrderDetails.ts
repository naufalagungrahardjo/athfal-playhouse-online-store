
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface OrderDetails {
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
  notes?: string;
  promo_code?: string;
  discount_amount?: number;
  created_at: string;
  items: OrderItem[];
}

export const useOrderDetails = (orderId?: string) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching order details for:', orderId);
      
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError) {
        console.error('Order fetch error:', orderError);
        throw orderError;
      }

      if (!orderData) {
        console.log('Order not found');
        setOrder(null);
        setLoading(false);
        return;
      }

      console.log('Order fetched:', orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Order items fetch error:', itemsError);
        throw itemsError;
      }

      console.log('Order items fetched:', itemsData);

      setOrder({
        ...orderData,
        items: itemsData || []
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch order details"
      });
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  return {
    order,
    loading,
    fetchOrderDetails
  };
};
