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

  const processOrder = async (orderData: OrderData): Promise<{ success: boolean; orderId?: string }> => {
    try {
      setProcessing(true);
      const errorId = `ORD-${Date.now()}`;
      console.log(`[${errorId}] Processing order:`, orderData);

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

      // Check current user status
      const { data: { user } } = await supabase.auth.getUser();
      console.log(`[${errorId}] Current user:`, user);

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
        discount_amount: orderData.discountAmount || 0
      };

      console.log(`[${errorId}] Order insert data (before submit):`, orderInsert);
      console.log(`[${errorId}] User authenticated:`, !!user);
      console.log(`[${errorId}] User ID:`, user?.id || 'null');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) {
        // NEW: Expose full error object and SQL error message to the user!
        console.error(`[${errorId}] Order creation error:`, orderError, orderInsert, orderData);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: `Supabase error: ${orderError.message || JSON.stringify(orderError)} [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      console.log(`[${errorId}] Order created successfully:`, order);

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }));

      console.log(`[${errorId}] Creating order items:`, orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error(`[${errorId}] Order items creation error:`, itemsError);
        toast({
          variant: "destructive",
          title: "Order Item Failed",
          description: `Supabase error: ${itemsError.message || "Unknown error!"} [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      console.log(`[${errorId}] Order items created successfully`);

      // Increment promo code usage count if promo was applied
      if (orderData.promoCodeId) {
        console.log(`[${errorId}] Incrementing promo code usage for ID:`, orderData.promoCodeId);
        
        try {
          // First get current promo code data
          const { data: promoData, error: fetchError } = await supabase
            .from('promo_codes')
            .select('usage_count, usage_limit, code')
            .eq('id', orderData.promoCodeId)
            .single();
            
          if (fetchError) {
            console.error(`[${errorId}] Error fetching promo code:`, fetchError);
            throw fetchError;
          }
          
          if (!promoData) {
            console.error(`[${errorId}] Promo code not found`);
            throw new Error('Promo code not found');
          }

          console.log(`[${errorId}] Current promo usage: ${promoData.usage_count}/${promoData.usage_limit || 'unlimited'}`);
          
          // Check if usage limit would be exceeded
          if (promoData.usage_limit !== null && promoData.usage_count >= promoData.usage_limit) {
            console.warn(`[${errorId}] Promo code ${promoData.code} has reached its limit`);
            // Don't increment - the limit has been reached
            // The order still completes successfully
          } else {
            // Increment usage count only if under limit
            const { data: updateData, error: promoError } = await supabase
              .from('promo_codes')
              .update({ usage_count: promoData.usage_count + 1 })
              .eq('id', orderData.promoCodeId)
              .select('usage_count')
              .single();
            
            if (promoError) {
              console.error(`[${errorId}] Error updating promo code usage:`, promoError);
              throw promoError;
            }
            
            console.log(`[${errorId}] Promo code usage updated successfully. New count: ${updateData?.usage_count}`);
          }
        } catch (error) {
          console.error(`[${errorId}] Failed to increment promo code usage:`, error);
          // Don't fail the entire order if promo update fails
          // But log it clearly for debugging
        }
      }

      // Store selected payment method in localStorage for order details page
      localStorage.setItem('selectedPaymentMethodId', orderData.paymentMethod);

      toast({
        title: "Order Successful",
        description: `Your order has been placed successfully! Order ID: ${order.id.slice(0, 8)}`
      });

      setProcessing(false);
      return { success: true, orderId: order.id };
    } catch (error: any) {
      const errorId = `ORD-${Date.now()}`;
      console.error(`[${errorId}] Error processing order:`, error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: `JS Error: ${(error && error.message) || JSON.stringify(error)} [${errorId}]`
      });
      setProcessing(false);
      return { success: false };
    }
  };

  return { processOrder, processing };
};
