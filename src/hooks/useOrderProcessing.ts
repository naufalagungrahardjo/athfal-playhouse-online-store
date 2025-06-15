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
      console.log('Processing order:', orderData);

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
          description: "One or more required fields are missing! Please check your checkout form."
        });
        setProcessing(false);
        return { success: false };
      }

      // Create the order with all required fields
      const orderInsert = {
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

      console.log('Order insert data (before submit):', orderInsert);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: orderError.message || "An error occurred while processing your order. Please try again."
        });
        return { success: false };
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');

      // Store selected payment method in localStorage for order details page
      localStorage.setItem('selectedPaymentMethodId', orderData.paymentMethod);

      toast({
        title: "Order Successful",
        description: `Your order has been placed successfully! Order ID: ${order.id.slice(0, 8)}`
      });

      return { success: true, orderId: order.id };
    } catch (error: any) {
      console.error('Error processing order:', error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "An error occurred while processing your order. Please try again."
      });
      return { success: false };
    } finally {
      setProcessing(false);
    }
  };

  return { processOrder, processing };
};
