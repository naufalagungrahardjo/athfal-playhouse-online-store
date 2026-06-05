
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

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

export const useDashboard = (dateRange?: DateRange) => {
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
      let ordersQuery = supabase
        .from('orders')
        .select('total_amount, subtotal, tax_amount, discount_amount, amount_paid, status, customer_email');

      if (dateRange?.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        ordersQuery = ordersQuery.gte('created_at', from.toISOString());
      }
      if (dateRange?.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        ordersQuery = ordersQuery.lte('created_at', to.toISOString());
      }

      const { data: orders, error: ordersError } = await ordersQuery;

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
      // Discounts must NEVER be counted as revenue or received cash — they only
      // appear in the "Discount Given" figure. We therefore work with NET values:
      //  - netTotal = subtotal + tax - discount (the real value of the sale)
      //  - netPaid  = cash received, capped at netTotal so a discount can never
      //    leak into revenue/paid even if legacy data recorded a higher amount_paid.
      const netTotal = (o: any) =>
        Math.max(0, (o.subtotal || 0) + (o.tax_amount || 0) - (o.discount_amount || 0));
      const netPaid = (o: any) => Math.min(Math.max(0, o.amount_paid || 0), netTotal(o));
      const paidRatio = (o: any) => {
        const nt = netTotal(o);
        if (nt <= 0) return 0;
        return Math.min(1, Math.max(0, netPaid(o) / nt));
      };
      const revenueBeforeTax = revenueOrders.reduce(
        (sum, o) => sum + Math.max(0, (o.subtotal || 0) - (o.discount_amount || 0)) * paidRatio(o),
        0,
      );
      const revenueAfterTax = revenueOrders.reduce((sum, o) => sum + netTotal(o) * paidRatio(o), 0);
      const totalDiscount = revenueOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
      const revenueAfterDiscount = revenueBeforeTax; // discount already excluded above
      const totalAmountPaid = revenueOrders.reduce((sum, o) => sum + netPaid(o), 0);
      const outstandingReceivables = revenueOrders.reduce(
        (sum, o) => sum + Math.max(0, netTotal(o) - netPaid(o)),
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
  }, [dateRange?.from, dateRange?.to]);

  return { stats, loading, fetchDashboardStats };
};
