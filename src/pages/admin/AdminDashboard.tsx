
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart,
  TrendingUp,
  Calendar,
} from 'lucide-react';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sales: 0,
    revenue: 0,
    visitors: 0,
    newCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch(period) {
        case 'daily':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Fetch orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalSales = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      setStats({
        sales: totalSales,
        revenue: totalRevenue,
        visitors: Math.floor(totalSales * 4.2), // Mock calculation
        newCustomers: Math.floor(totalSales * 0.6) // Mock calculation
      });

      // Fetch recent orders (last 5)
      const { data: recentOrdersData, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentOrders(recentOrdersData || []);

      // Fetch top products
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, product_name, product_price, quantity');

      if (itemsError) throw itemsError;

      // Group by product and calculate totals
      const productStats: { [key: string]: { name: string, sales: number, revenue: number } } = {};
      
      orderItems?.forEach(item => {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = {
            name: item.product_name,
            sales: 0,
            revenue: 0
          };
        }
        productStats[item.product_id].sales += item.quantity;
        productStats[item.product_id].revenue += item.product_price * item.quantity;
      });

      // Convert to array and sort by sales
      const topProductsArray = Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setTopProducts(topProductsArray);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-500 mt-1">Welcome to Athfal Playhouse admin panel</p>
        </div>
      </div>

      {/* Stats Period Select */}
      <div className="flex justify-end">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly' | 'monthly')}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.sales}</div>
            <p className="text-xs text-gray-500">orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-gray-500">total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Visitors</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.visitors}</div>
            <p className="text-xs text-gray-500">unique visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">New Customers</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.newCustomers}</div>
            <p className="text-xs text-gray-500">registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td className="px-4 py-3 font-medium text-gray-800">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-gray-600">{order.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(order.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'completed' ? 'Completed' : 
                           order.status === 'pending' ? 'Pending' : 
                           order.status === 'processing' ? 'Processing' :
                           'Cancelled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/orders')}
              >
                View All Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Sales</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((product) => (
                    <tr key={product.id} className="text-sm">
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-right">{product.sales}</td>
                      <td className="px-4 py-3 text-gray-600 text-right">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/products')}
              >
                View All Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar / Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Upcoming Classes</CardTitle>
          <Calendar className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-athfal-peach/10 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-athfal-pink rounded-lg flex items-center justify-center text-white font-bold">
                <div className="text-center">
                  <div className="text-xs">MAY</div>
                  <div className="text-lg">24</div>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium">Pop Up Class - Usia 2-3 Tahun</h4>
                <p className="text-sm text-gray-600">10:00 - 11:30 • 8 registered</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">Details</Button>
            </div>

            <div className="flex items-center p-3 bg-athfal-yellow/10 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-athfal-yellow rounded-lg flex items-center justify-center text-black font-bold">
                <div className="text-center">
                  <div className="text-xs">MAY</div>
                  <div className="text-lg">25</div>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium">Bumi Class: Mengenal Alam</h4>
                <p className="text-sm text-gray-600">15:00 - 16:30 • 5 registered</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">Details</Button>
            </div>

            <div className="flex items-center p-3 bg-athfal-teal/10 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-athfal-teal rounded-lg flex items-center justify-center text-white font-bold">
                <div className="text-center">
                  <div className="text-xs">MAY</div>
                  <div className="text-lg">26</div>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium">Tahsin Class - Pemula</h4>
                <p className="text-sm text-gray-600">09:00 - 10:30 • 12 registered</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">Details</Button>
            </div>
          </div>
          <div className="mt-4 text-right">
            <Button variant="outline" size="sm">View Calendar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
