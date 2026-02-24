import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/contexts/CartContext';

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  paymentMethod: string;
  notes?: string;
  childName?: string;
  childAge?: string;
  childBirthdate?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  promoCode?: string | null;
  discountAmount?: number;
  promoCodeId?: string | null;
}

export const useOrderProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const processOrder = async (orderData: OrderData): Promise<{ success: boolean; orderId?: string; lookupToken?: string }> => {
    try {
      setProcessing(true);
      const errorId = `ORD-${Date.now()}`;

      // Validate stock from database before proceeding
      for (const item of orderData.items) {
        const { data: productData, error: stockError } = await supabase
          .from('products')
          .select('stock, name')
          .eq('product_id', item.product.id)
          .single();

        if (stockError || !productData) {
          toast({ variant: "destructive", title: "Stock Error", description: `Could not verify stock for ${item.product.name}. [${errorId}]` });
          setProcessing(false);
          return { success: false };
        }
        if (productData.stock <= 0) {
          toast({ variant: "destructive", title: "Product Sold Out", description: `${productData.name} is sold out. Please remove it from your cart.` });
          setProcessing(false);
          return { success: false };
        }
        if (item.quantity > productData.stock) {
          toast({ variant: "destructive", title: "Insufficient Stock", description: `Only ${productData.stock} of ${productData.name} available.` });
          setProcessing(false);
          return { success: false };
        }
      }

      // Validate required fields for guest orders
      if (
        !orderData.customerName ||
        !orderData.customerEmail ||
        !orderData.customerPhone ||
        !orderData.paymentMethod ||
        typeof orderData.subtotal !== "number" ||
        typeof orderData.taxAmount !== "number" ||
        typeof orderData.totalAmount !== "number"
      ) {
        toast({
          variant: "destructive",
          title: "Order Error",
          description: `One or more required fields are missing! Please check your checkout form. [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      // Enforce promo code usage limit BEFORE creating order
      if (orderData.promoCodeId && orderData.promoCode) {
        // Pre-validate and increment promo usage
        
        // Use SECURITY DEFINER RPC to validate (works for anonymous users too)
        const { data: promoResult, error: promoCheckError } = await supabase
          .rpc('validate_promo_code', { code_input: orderData.promoCode });

        if (promoCheckError || !promoResult || promoResult.length === 0) {
          console.error(`[${errorId}] Promo pre-check failed`);
          toast({
            variant: "destructive",
            title: "Promo unavailable",
            description: `The promo code is not valid or has expired. [${errorId}]`
          });
          setProcessing(false);
          return { success: false };
        }

        // Reserve the usage slot atomically via secure RPC (no need to know current count)
        const { data: reserved, error: promoIncError } = await supabase
          .rpc('increment_promo_usage_by_code' as any, {
            promo_code_value: orderData.promoCode
          });

        if (promoIncError || !reserved) {
          console.error(`[${errorId}] Failed to reserve promo usage`);
          toast({
            variant: "destructive",
            title: "Promo quota reached",
            description: `Sorry, this promo has just reached its limit. [${errorId}]`
          });
          setProcessing(false);
          return { success: false };
        }

        // Promo usage reserved successfully
      }

      // Check current user status
      const { data: { user } } = await supabase.auth.getUser();

      // Create the order with all required fields
      const orderInsert = {
        user_id: user?.id || null, // Explicitly set user_id
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress || null,
        payment_method: orderData.paymentMethod,
        notes: orderData.notes || null,
        subtotal: orderData.subtotal,
        tax_amount: orderData.taxAmount,
        total_amount: orderData.totalAmount,
        status: 'pending',
        promo_code: orderData.promoCode || null,
        discount_amount: orderData.discountAmount || 0,
        child_name: orderData.childName || null,
        child_age: orderData.childAge || null,
        child_birthdate: orderData.childBirthdate || null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) {
        console.error(`[${errorId}] Order creation failed`);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: `An error occurred while placing your order. Please try again. [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      // Order created successfully

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }));

      // Creating order items

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error(`[${errorId}] Order items creation failed`);
        toast({
          variant: "destructive",
          title: "Order Item Failed",
          description: `An error occurred while saving order items. Please try again. [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      // Order items created successfully

      // Increment promo code usage count if promo was applied
      // Promo code usage is now validated and incremented BEFORE order creation to strictly enforce quota.
      // No action needed here.


      // Store selected payment method in localStorage for order details page
      localStorage.setItem('selectedPaymentMethodId', orderData.paymentMethod);

      toast({
        title: "Order Successful",
        description: `Your order has been placed successfully! Order ID: ${order.id.slice(0, 8)}`
      });

      setProcessing(false);
      return { success: true, orderId: order.id, lookupToken: order.lookup_token };
    } catch (error: any) {
      const errorId = `ORD-${Date.now()}`;
      console.error(`[${errorId}] Unexpected order error`);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: `An unexpected error occurred. Please try again. [${errorId}]`
      });
      setProcessing(false);
      return { success: false };
    }
  };

  return { processOrder, processing };
};
