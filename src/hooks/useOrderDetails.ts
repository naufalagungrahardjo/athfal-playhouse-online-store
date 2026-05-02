
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBaseProductId, resolveOrderItemMetadata } from '@/lib/orderItemMetadata';
import { logger } from '@/utils/logger';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  product_image?: string;
  first_payment?: number;
  installment?: number;
  installment_months?: number;
  session_name?: string | null;
  installment_plan_name?: string | null;
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
      logger.log('Fetching order details for:', orderId, 'with token:', lookupToken ? 'yes' : 'no');
      
      let orderData: any = null;
      let itemsData: any[] = [];

      if (lookupToken) {
        // Guest order lookup via secure RPC
        const { data: rpcOrder, error: rpcError } = await supabase
          .rpc('get_order_by_token', { p_order_id: orderId, p_token: lookupToken });

        if (rpcError) {
          logger.error('RPC order fetch error:', rpcError);
          throw rpcError;
        }
        orderData = rpcOrder?.[0] || null;

        if (orderData) {
          const { data: rpcItems, error: rpcItemsError } = await supabase
            .rpc('get_order_items_by_token', { p_order_id: orderId, p_token: lookupToken });

          if (rpcItemsError) {
            logger.error('RPC order items fetch error:', rpcItemsError);
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
          logger.error('Order fetch error:', orderError);
          throw orderError;
        }
        orderData = data;

        if (orderData) {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

          if (itemsError) {
            logger.error('Order items fetch error:', itemsError);
            throw itemsError;
          }
          itemsData = items || [];
        }
      }

      if (!orderData) {
        logger.log('Order not found');
        setOrder(null);
        setLoading(false);
        return;
      }

      logger.log('Order fetched:', orderData);

      const baseProductIds = [...new Set(itemsData.map((item: any) => getBaseProductId(item.product_id)).filter(Boolean))];
      let productsData: any[] = [];
      let variantsData: any[] = [];

      if (baseProductIds.length > 0) {
        const { data: fetchedProducts } = await supabase
          .from('products')
          .select('id, product_id, name, image, first_payment, installment, installment_months, price')
          .in('product_id', baseProductIds);

        productsData = fetchedProducts || [];

        const productDbIds = productsData.map((product) => product.id);
        if (productDbIds.length > 0) {
          const { data: fetchedVariants } = await supabase
            .from('product_variants')
            .select('id, product_id, name, price')
            .in('product_id', productDbIds);

          variantsData = fetchedVariants || [];
        }
      }

      const productByPublicId = new Map(productsData.map((product) => [product.product_id, product]));
      const variantsByProductDbId = new Map<string, any[]>();
      for (const variant of variantsData) {
        const existing = variantsByProductDbId.get(variant.product_id) || [];
        existing.push(variant);
        variantsByProductDbId.set(variant.product_id, existing);
      }

      const itemsWithImages = itemsData.map((item: any) => {
        const productData = productByPublicId.get(getBaseProductId(item.product_id));
        const variants = productData ? variantsByProductDbId.get(productData.id) || [] : [];
        const resolved = resolveOrderItemMetadata(item, productData, variants);

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: resolved.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          product_image: productData?.image || '',
          first_payment: productData?.first_payment || 0,
          installment: productData?.installment || 0,
          installment_months: productData?.installment_months || 0,
          session_name: resolved.session_name,
          installment_plan_name: resolved.installment_plan_name,
        };
      });

      setOrder({
        ...orderData,
        items: itemsWithImages
      });
    } catch (error) {
      logger.error('Error fetching order details:', error);
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
