import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/contexts/CartContext';
import { logger } from '@/utils/logger';

interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  guardianStatus?: string;
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

      // Validate stock from database - aggregate quantities per base product
      const getBaseId = (id: string) => id.includes('__') ? id.split('__')[0] : id;
      const qtyByBase: Record<string, number> = {};
      for (const item of orderData.items) {
        const base = getBaseId(item.product.id);
        qtyByBase[base] = (qtyByBase[base] || 0) + item.quantity;
      }

      const baseIds = Object.keys(qtyByBase);
      const { data: freshStock, error: stockError } = await supabase
        .from('products')
        .select('product_id, stock, name, is_sold_out')
        .in('product_id', baseIds);

      if (stockError || !freshStock) {
        toast({ variant: "destructive", title: "Stock Error", description: `Could not verify stock. [${errorId}]` });
        setProcessing(false);
        return { success: false };
      }

      for (const [baseId, totalQty] of Object.entries(qtyByBase)) {
        const product = freshStock.find(p => p.product_id === baseId);
        const effectiveStock = product?.is_sold_out ? 0 : (product?.stock ?? 0);
        if (!product || effectiveStock <= 0) {
          toast({ variant: "destructive", title: "Product Sold Out", description: `${product?.name || baseId} is sold out.` });
          setProcessing(false);
          return { success: false };
        }
        if (totalQty > effectiveStock) {
          toast({ variant: "destructive", title: "Insufficient Stock", description: `There are only ${effectiveStock} stock available left for ${product.name}, please adjust your cart before proceeding check out` });
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
          logger.error(`[${errorId}] Promo pre-check failed`);
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
          logger.error(`[${errorId}] Failed to reserve promo usage`);
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

      // Generate order ID client-side so we don't need .select() (which requires SELECT RLS permission)
      const orderId = crypto.randomUUID();

      // Create the order with all required fields
      const orderInsert = {
        id: orderId,
        user_id: user?.id || null, // Explicitly set user_id
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress || null,
        guardian_status: orderData.guardianStatus || null,
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

      // Use plain insert without .select() to avoid SELECT RLS restrictions for guest users
      const { error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert);

      if (orderError) {
        logger.error(`[${errorId}] Order creation failed`);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: `An error occurred while placing your order. Please try again. [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      // Order created successfully

      // Create order items - store base product_id so stock trigger can match
      // Parse session_id and installment_plan_id from composite cart id (format: BASE__variant_X__sess_Y__plan_Z)
      const parseCompositeId = (id: string) => {
        const parts = id.split('__');
        let session_id: string | null = null;
        let installment_plan_id: string | null = null;
        for (const p of parts) {
          if (p.startsWith('sess_')) session_id = p.slice(5);
          if (p.startsWith('plan_')) installment_plan_id = p.slice(5);
        }
        return { session_id, installment_plan_id };
      };
      const orderItems = orderData.items.map(item => {
        const { session_id, installment_plan_id } = parseCompositeId(item.product.id);
        return {
          order_id: orderId,
          product_id: getBaseId(item.product.id),
          product_name: item.product.name,
          product_price: item.product.price,
          quantity: item.quantity,
          session_id,
          installment_plan_id,
        };
      });

      // Creating order items

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        logger.error(`[${errorId}] Order items creation failed`);
        toast({
          variant: "destructive",
          title: "Order Item Failed",
          description: `An error occurred while saving order items. Please try again. [${errorId}]`
        });
        setProcessing(false);
        return { success: false };
      }

      // Order items created successfully

      // Create order_payments rows from selected installment plans
      try {
        const planIds = [...new Set(orderItems.map(i => i.installment_plan_id).filter(Boolean) as string[])];
        const planMap: Record<string, { num_payments: number; payment_amounts: number[] }> = {};
        if (planIds.length > 0) {
          const { data: planRows } = await supabase
            .from('product_installment_plans' as any)
            .select('id, num_payments, payment_amounts')
            .in('id', planIds);
          (planRows || []).forEach((p: any) => {
            planMap[p.id] = { num_payments: p.num_payments, payment_amounts: Array.isArray(p.payment_amounts) ? p.payment_amounts : [] };
          });
        }

        // Use the FIRST item's plan to drive the order's payment schedule
        // (multi-plan orders default to a single full-payment row)
        const firstPlanId = orderItems.find(i => i.installment_plan_id)?.installment_plan_id;
        const plan = firstPlanId ? planMap[firstPlanId] : null;
        const total = orderData.totalAmount;

        if (plan && plan.num_payments > 1) {
          const predef = plan.payment_amounts.slice(0, plan.num_payments - 1);
          const sumPredef = predef.reduce((a, b) => a + (b || 0), 0);
          const lastAmount = Math.max(0, total - sumPredef);
          const rows = [
            ...predef.map((amt, idx) => ({
              order_id: orderId,
              payment_number: idx + 1,
              amount: amt || 0,
              status: 'unpaid' as const,
            })),
            { order_id: orderId, payment_number: plan.num_payments, amount: lastAmount, status: 'unpaid' as const },
          ];
          await supabase.from('order_payments' as any).insert(rows);
        } else {
          // Single payment row
          await supabase.from('order_payments' as any).insert({
            order_id: orderId, payment_number: 1, amount: total, status: 'unpaid',
          });
        }
      } catch (e) {
        logger.error(`[${errorId}] Failed to create order payments (non-blocking)`, e);
      }

      // Deduct stock via SECURITY DEFINER RPC (bypasses RLS)
      const { error: stockDeductError } = await supabase
        .rpc('deduct_stock_for_order', { p_order_id: orderId });

      if (stockDeductError) {
        logger.error(`[${errorId}] Stock deduction failed: ${stockDeductError.message}`);
      }

      // Auto-create MDR expense via SECURITY DEFINER RPC (bypasses RLS)
      try {
        await supabase.rpc('create_mdr_expense_for_order' as any, { p_order_id: orderId });
      } catch (mdrError) {
        logger.error(`[${errorId}] MDR expense creation failed (non-blocking):`, mdrError);
      }

      // Increment promo code usage count if promo was applied
      // Promo code usage is now validated and incremented BEFORE order creation to strictly enforce quota.
      // No action needed here.


      // Store selected payment method in localStorage for order details page
      localStorage.setItem('selectedPaymentMethodId', orderData.paymentMethod);

      toast({
        title: "Order Successful",
        description: `Your order has been placed successfully! Order ID: ${orderId.slice(0, 8)}`
      });

      // Send order alert emails (fire-and-forget, don't block checkout)
      try {
        supabase.functions.invoke('order-alert-email', {
          body: {
            orderId: orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress,
            childName: orderData.childName,
            childAge: orderData.childAge,
            childBirthdate: orderData.childBirthdate,
            guardianStatus: orderData.guardianStatus,
            notes: orderData.notes,
            paymentMethod: orderData.paymentMethod,
            totalAmount: orderData.totalAmount,
            subtotal: orderData.subtotal,
            taxAmount: orderData.taxAmount,
            discountAmount: orderData.discountAmount,
            promoCode: orderData.promoCode,
            items: orderItems,
          },
        });
      } catch (alertError) {
        logger.error('Order alert email failed (non-blocking):', alertError);
      }

      // Retrieve lookup_token via SECURITY DEFINER RPC (works for guest users too)
      let lookupToken: string | undefined;
      try {
        const { data: token } = await supabase
          .rpc('get_order_lookup_token' as any, { p_order_id: orderId });
        lookupToken = token || undefined;
      } catch {
        logger.error(`[${errorId}] Failed to retrieve lookup token (non-blocking)`);
      }

      setProcessing(false);
      return { success: true, orderId: orderId, lookupToken };
    } catch (error: any) {
      const errorId = `ORD-${Date.now()}`;
      logger.error(`[${errorId}] Unexpected order error`);
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
