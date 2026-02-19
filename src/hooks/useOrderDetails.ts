
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  product_image?: string;
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

export const useOrderDetails = (orderId?: string, lookupToken?: string) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching order details for:', orderId, 'with token:', lookupToken ? 'yes' : 'no');
      
      let orderData: any = null;
      let itemsData: any[] = [];

      if (lookupToken) {
        // Guest order lookup via secure RPC
        const { data: rpcOrder, error: rpcError } = await supabase
          .rpc('get_order_by_token', { p_order_id: orderId, p_token: lookupToken });

        if (rpcError) {
          console.error('RPC order fetch error:', rpcError);
          throw rpcError;
        }
        orderData = rpcOrder?.[0] || null;

        if (orderData) {
          const { data: rpcItems, error: rpcItemsError } = await supabase
            .rpc('get_order_items_by_token', { p_order_id: orderId, p_token: lookupToken });

          if (rpcItemsError) {
            console.error('RPC order items fetch error:', rpcItemsError);
            throw rpcItemsError;
          }
          itemsData = rpcItems || [];
        }
      } else {
        // Authenticated user order lookup via RLS
        const { data, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();

        if (orderError) {
          console.error('Order fetch error:', orderError);
          throw orderError;
        }
        orderData = data;

        if (orderData) {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

          if (itemsError) {
            console.error('Order items fetch error:', itemsError);
            throw itemsError;
          }
          itemsData = items || [];
        }
      }

      if (!orderData) {
        console.log('Order not found');
        setOrder(null);
        setLoading(false);
        return;
      }

      console.log('Order fetched:', orderData);

      // Fetch product images separately for each product
      const itemsWithImages = await Promise.all(
        itemsData.map(async (item: any) => {
          const { data: productData } = await supabase
            .from('products')
            .select('image')
            .eq('product_id', item.product_id)
            .maybeSingle();

          return {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_price: item.product_price,
            quantity: item.quantity,
            product_image: productData?.image || ''
          };
        })
      );

      setOrder({
        ...orderData,
        items: itemsWithImages
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
  }, [orderId, lookupToken, toast]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  return {
    order,
    loading,
    fetchOrderDetails
  };
};
