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
