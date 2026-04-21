
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalOrders: number;
  revenueBeforeTax: number;
  revenueAfterTax: number;
  revenueAfterDiscount: number;
  totalDiscount: number;
  outstandingReceivables: number;
  totalAmountPaid: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    revenueBeforeTax: 0,
    revenueAfterTax: 0,
    revenueAfterDiscount: 0,
    totalDiscount: 0,
    outstandingReceivables: 0,
    totalAmountPaid: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch orders data with all required fields
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, subtotal, tax_amount, discount_amount, amount_paid, status, customer_email');

      if (ordersError) throw ordersError;

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Calculate stats - exclude cancelled and refund orders from revenue
      // Revenue is scaled by paid ratio (cash basis): only count actually-received money
      const totalOrders = orders?.length || 0;
      const revenueOrders = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'refund') || [];
      const paidRatio = (o: any) => {
        const total = o.total_amount || 0;
        if (total <= 0) return 0;
        return Math.min(1, Math.max(0, (o.amount_paid || 0) / total));
      };
      const revenueBeforeTax = revenueOrders.reduce((sum, o) => sum + (o.subtotal || 0) * paidRatio(o), 0);
      const revenueAfterTax = revenueOrders.reduce((sum, o) => sum + ((o.subtotal || 0) + (o.tax_amount || 0)) * paidRatio(o), 0);
      const totalDiscount = revenueOrders.reduce((sum, o) => sum + (o.discount_amount || 0) * paidRatio(o), 0);
      const revenueAfterDiscount = revenueBeforeTax - totalDiscount;
      const totalAmountPaid = revenueOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
      const outstandingReceivables = revenueOrders.reduce(
        (sum, o) => sum + Math.max(0, (o.total_amount || 0) - (o.amount_paid || 0)),
        0,
      );
      const totalProducts = productsCount || 0;
      const totalCustomers = new Set(orders?.map(order => order.customer_email)).size || 0;
      
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const processingOrders = orders?.filter(order => order.status === 'processing').length || 0;
      const shippedOrders = orders?.filter(order => order.status === 'shipped').length || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const cancelledOrders = orders?.filter(order => order.status === 'cancelled').length || 0;

      setStats({
        totalOrders,
        revenueBeforeTax: Math.round(revenueBeforeTax),
        revenueAfterTax: Math.round(revenueAfterTax),
        revenueAfterDiscount: Math.round(revenueAfterDiscount),
        totalDiscount: Math.round(totalDiscount),
        outstandingReceivables,
        totalAmountPaid,
        totalProducts,
        totalCustomers,
        pendingOrders,
        processingOrders,
        shippedOrders,
        completedOrders,
        cancelledOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return { stats, loading, fetchDashboardStats };
};
