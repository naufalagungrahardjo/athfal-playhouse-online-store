
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalOrders: number;
  revenueBeforeTax: number;
  revenueAfterTax: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    revenueBeforeTax: 0,
    revenueAfterTax: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, subtotal, status');

      if (ordersError) throw ordersError;

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const revenueBeforeTax = orders?.reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0;
      const revenueAfterTax = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalProducts = productsCount || 0;
      const totalCustomers = new Set(orders?.map(order => order.customer_email)).size || 0;
      
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const cancelledOrders = orders?.filter(order => order.status === 'cancelled').length || 0;

      setStats({
        totalOrders,
        revenueBeforeTax,
        revenueAfterTax,
        totalProducts,
        totalCustomers,
        pendingOrders,
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
