import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

interface OrderWithItems {
  id: string;
  created_at: string;
  payment_method: string;
  status: string;
  total_amount: number;
  items: { product_id: string; product_name: string; quantity: number; product_price: number }[];
}

const AdminAnalytics = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [products, setProducts] = useState<{ product_id: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [ordersRes, itemsRes, catsRes, prodsRes] = await Promise.all([
        supabase.from('orders').select('id, created_at, payment_method, status, total_amount').order('created_at', { ascending: true }),
        supabase.from('order_items').select('order_id, product_id, product_name, quantity, product_price'),
        supabase.from('categories').select('slug, title'),
        supabase.from('products').select('product_id, category'),
      ]);

      const itemsByOrder: Record<string, any[]> = {};
      (itemsRes.data || []).forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });

      setOrders((ordersRes.data || []).map(o => ({ ...o, items: itemsByOrder[o.id] || [] })));
      setCategories(catsRes.data || []);
      setProducts(prodsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Product to category map
  const productCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach(p => { map[p.product_id] = p.category; });
    return map;
  }, [products]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Exclude cancelled
      if (order.status === 'cancelled') return false;
      // Date filter
      if (dateRange?.from) {
        const d = new Date(order.created_at);
        if (d < dateRange.from) return false;
        if (dateRange.to && d > new Date(dateRange.to.getTime() + 86400000)) return false;
      }
      // Category filter
      if (categoryFilter !== 'all') {
        const hasCategory = order.items.some(item => productCategoryMap[item.product_id] === categoryFilter);
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [orders, dateRange, categoryFilter, productCategoryMap]);

  // Filter items by category too
  const getFilteredItems = (order: OrderWithItems) => {
    if (categoryFilter === 'all') return order.items;
    return order.items.filter(item => productCategoryMap[item.product_id] === categoryFilter);
  };

  // 1) Daily sales quantity line chart
  const dailySalesData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const day = format(new Date(order.created_at), 'yyyy-MM-dd');
      const qty = getFilteredItems(order).reduce((sum, item) => sum + item.quantity, 0);
      map[day] = (map[day] || 0) + qty;
    });
    return Object.entries(map).sort().map(([date, qty]) => ({ date, quantity: qty }));
  }, [filteredOrders, categoryFilter]);

  // 2) Product proportion pie chart
  const productProportionData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(order => {
      getFilteredItems(order).forEach(item => {
        map[item.product_name] = (map[item.product_name] || 0) + item.quantity;
      });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, qty]) => ({ name, value: qty, percentage: total > 0 ? ((qty / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders, categoryFilter]);

  // 3) Payment method proportion pie chart
  const paymentProportionData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const method = order.payment_method || 'Unknown';
      map[method] = (map[method] || 0) + 1;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, count]) => ({ name, value: count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // 4) Product sales bar chart (quantity & value)
  const productSalesBarData = useMemo(() => {
    const qtyMap: Record<string, number> = {};
    const valMap: Record<string, number> = {};
    filteredOrders.forEach(order => {
      getFilteredItems(order).forEach(item => {
        qtyMap[item.product_name] = (qtyMap[item.product_name] || 0) + item.quantity;
        valMap[item.product_name] = (valMap[item.product_name] || 0) + item.product_price * item.quantity;
      });
    });
    return Object.keys(qtyMap)
      .map(name => ({ name, quantity: qtyMap[name], value: valMap[name] }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders, categoryFilter]);

  const renderPercentageLabel = ({ name, percentage }: any) => `${name}: ${percentage}%`;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-center py-12">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-sm font-medium block mb-1">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}` : format(dateRange.from, 'PP')
                ) : 'All time'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Product Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.slug} value={cat.slug}>{cat.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {dateRange && (
          <Button variant="ghost" onClick={() => setDateRange(undefined)}>Clear dates</Button>
        )}
      </div>

      {/* 1) Daily Sales Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Product Sales Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySalesData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sales data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="quantity" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} name="Quantity Sold" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2) Product Proportion Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Proportion</CardTitle>
          </CardHeader>
          <CardContent>
            {productProportionData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={productProportionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {productProportionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value} units (${props.payload.percentage}%)`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 3) Payment Method Proportion Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Proportion</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentProportionData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={paymentProportionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {paymentProportionData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value} orders (${props.payload.percentage}%)`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4) Product Sales Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sales Ranking (Quantity & Value)</CardTitle>
        </CardHeader>
        <CardContent>
          {productSalesBarData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, productSalesBarData.length * 40)}>
              <BarChart data={productSalesBarData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number, name: string) => name === 'value' ? formatCurrency(value) : value} />
                <Legend />
                <Bar dataKey="quantity" fill="#8884d8" name="Quantity" />
                <Bar dataKey="value" fill="#82ca9d" name="Sales Value (Rp)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
