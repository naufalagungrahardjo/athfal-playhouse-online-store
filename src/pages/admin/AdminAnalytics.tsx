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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#64748b'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (parseFloat(percentage) < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${percentage}%`}
    </text>
  );
};

type TimeGranularity = 'daily' | 'monthly' | 'yearly';

interface OrderWithItems {
  id: string;
  created_at: string;
  payment_method: string;
  status: string;
  total_amount: number;
  items: { product_id: string; product_name: string; quantity: number; product_price: number }[];
}

type ExpenseRow = { id: string; description: string; category_id: string | null; fund_source_id: string | null; amount: number; date: string };
type ExpenseCategory = { id: string; name: string };
type FundSource = { id: string; name: string };
type OtherIncomeRow = { id: string; description: string; amount: number; fund_source_id: string | null; date: string };

const formatDateKey = (dateStr: string, granularity: TimeGranularity): string => {
  const d = new Date(dateStr);
  switch (granularity) {
    case 'daily': return format(d, 'yyyy-MM-dd');
    case 'monthly': return format(d, 'yyyy-MM');
    case 'yearly': return format(d, 'yyyy');
  }
};

const AdminAnalytics = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [categories, setCategories] = useState<{ slug: string; title: string }[]>([]);
  const [products, setProducts] = useState<{ product_id: string; category: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('daily');

  // Expense data
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [expGranularity, setExpGranularity] = useState<TimeGranularity>('monthly');
  const [expCatFilter, setExpCatFilter] = useState('all');
  const [expFundFilter, setExpFundFilter] = useState('all');

  // Other Income data
  const [otherIncomes, setOtherIncomes] = useState<OtherIncomeRow[]>([]);
  const [incGranularity, setIncGranularity] = useState<TimeGranularity>('monthly');
  const [incFundFilter, setIncFundFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [ordersRes, itemsRes, catsRes, prodsRes, expRes, expCatsRes, fundsRes, incRes] = await Promise.all([
        supabase.from('orders').select('id, created_at, payment_method, status, total_amount').order('created_at', { ascending: true }),
        supabase.from('order_items').select('order_id, product_id, product_name, quantity, product_price'),
        supabase.from('categories').select('slug, title'),
        supabase.from('products').select('product_id, category'),
        supabase.from('expenses' as any).select('*').order('date', { ascending: true }),
        supabase.from('expense_categories' as any).select('id, name'),
        supabase.from('expense_fund_sources' as any).select('id, name'),
        supabase.from('other_income' as any).select('*').order('date', { ascending: true }),
      ]);

      const itemsByOrder: Record<string, any[]> = {};
      (itemsRes.data || []).forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });

      setOrders((ordersRes.data || []).map(o => ({ ...o, items: itemsByOrder[o.id] || [] })));
      setCategories(catsRes.data || []);
      setProducts(prodsRes.data || []);
      setExpenses((expRes.data as any) || []);
      setExpenseCategories((expCatsRes.data as any) || []);
      setFundSources((fundsRes.data as any) || []);
      setOtherIncomes((incRes.data as any) || []);
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
      if (statusFilter === 'all') {
        if (order.status === 'cancelled') return false;
      } else if (order.status !== statusFilter) {
        return false;
      }
      if (dateRange?.from) {
        const d = new Date(order.created_at);
        if (d < dateRange.from) return false;
        if (dateRange.to && d > new Date(dateRange.to.getTime() + 86400000)) return false;
      }
      if (categoryFilter !== 'all') {
        const hasCategory = order.items.some(item => productCategoryMap[item.product_id] === categoryFilter);
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [orders, dateRange, categoryFilter, statusFilter, productCategoryMap]);

  const getFilteredItems = (order: OrderWithItems) => {
    if (categoryFilter === 'all') return order.items;
    return order.items.filter(item => productCategoryMap[item.product_id] === categoryFilter);
  };

  const salesQuantityData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const key = formatDateKey(order.created_at, timeGranularity);
      const qty = getFilteredItems(order).reduce((sum, item) => sum + item.quantity, 0);
      map[key] = (map[key] || 0) + qty;
    });
    return Object.entries(map).sort().map(([date, qty]) => ({ date, quantity: qty }));
  }, [filteredOrders, categoryFilter, timeGranularity]);

  const salesValueData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const key = formatDateKey(order.created_at, timeGranularity);
      const val = getFilteredItems(order).reduce((sum, item) => sum + item.product_price * item.quantity, 0);
      map[key] = (map[key] || 0) + val;
    });
    return Object.entries(map).sort().map(([date, value]) => ({ date, value }));
  }, [filteredOrders, categoryFilter, timeGranularity]);

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

  // === Expense analytics ===
  const expCatMap = useMemo(() => Object.fromEntries(expenseCategories.map(c => [c.id, c.name])), [expenseCategories]);
  const expFundMap = useMemo(() => Object.fromEntries(fundSources.map(f => [f.id, f.name])), [fundSources]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (expCatFilter !== 'all' && e.category_id !== expCatFilter) return false;
      if (expFundFilter !== 'all' && e.fund_source_id !== expFundFilter) return false;
      return true;
    });
  }, [expenses, expCatFilter, expFundFilter]);

  // Expense trend (area chart)
  const expenseTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const key = formatDateKey(e.date, expGranularity);
      map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map).sort().map(([date, total]) => ({ date, total }));
  }, [filteredExpenses, expGranularity]);

  // Expense by category (stacked bar)
  const expenseByCategoryData = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    const catNames = new Set<string>();
    filteredExpenses.forEach(e => {
      const key = formatDateKey(e.date, expGranularity);
      const catName = e.category_id ? (expCatMap[e.category_id] || 'Uncategorized') : 'Uncategorized';
      catNames.add(catName);
      if (!dateMap[key]) dateMap[key] = {};
      dateMap[key][catName] = (dateMap[key][catName] || 0) + e.amount;
    });
    const sortedDates = Object.keys(dateMap).sort();
    return { data: sortedDates.map(date => ({ date, ...dateMap[date] })), categories: Array.from(catNames) };
  }, [filteredExpenses, expGranularity, expCatMap]);

  // Expense by category pie
  const expenseCatPieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const catName = e.category_id ? (expCatMap[e.category_id] || 'Uncategorized') : 'Uncategorized';
      map[catName] = (map[catName] || 0) + e.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, expCatMap]);

  // Expense by fund source pie
  const expenseFundPieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const fundName = e.fund_source_id ? (expFundMap[e.fund_source_id] || 'Unknown') : 'Unknown';
      map[fundName] = (map[fundName] || 0) + e.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, expFundMap]);

  const totalExpense = useMemo(() => filteredExpenses.reduce((s, e) => s + e.amount, 0), [filteredExpenses]);

  // === Other Income analytics ===
  const filteredIncomes = useMemo(() => {
    return otherIncomes.filter(i => {
      if (incFundFilter !== 'all' && i.fund_source_id !== incFundFilter) return false;
      return true;
    });
  }, [otherIncomes, incFundFilter]);

  const incomeTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach(i => {
      const key = formatDateKey(i.date, incGranularity);
      map[key] = (map[key] || 0) + i.amount;
    });
    return Object.entries(map).sort().map(([date, total]) => ({ date, total }));
  }, [filteredIncomes, incGranularity]);

  const incomeFundPieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach(i => {
      const fundName = i.fund_source_id ? (expFundMap[i.fund_source_id] || 'Unknown') : 'Unknown';
      map[fundName] = (map[fundName] || 0) + i.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredIncomes, expFundMap]);

  const totalIncome = useMemo(() => filteredIncomes.reduce((s, i) => s + i.amount, 0), [filteredIncomes]);

  const granularityLabel = timeGranularity === 'daily' ? 'Daily' : timeGranularity === 'monthly' ? 'Monthly' : 'Yearly';
  const expGranLabel = expGranularity === 'daily' ? 'Daily' : expGranularity === 'monthly' ? 'Monthly' : 'Yearly';
  const incGranLabel = incGranularity === 'daily' ? 'Daily' : incGranularity === 'monthly' ? 'Monthly' : 'Yearly';

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

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="expense">Expense Analytics</TabsTrigger>
          <TabsTrigger value="income">Other Income</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}` : format(dateRange.from, 'PP')
                      ) : 'All Lifetime'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="p-3 pointer-events-auto" />
                    <div className="p-3 border-t">
                      <Button variant="ghost" className="w-full text-sm" onClick={() => setDateRange(undefined)}>Show All Lifetime Data</Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {dateRange && <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>Clear</Button>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Time Granularity</label>
              <Select value={timeGranularity} onValueChange={(v) => setTimeGranularity(v as TimeGranularity)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Product Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.slug} value={cat.slug}>{cat.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Order Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (excl. Cancelled)</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>{granularityLabel} Product Sales Quantity</CardTitle></CardHeader>
            <CardContent>
              {salesQuantityData.length === 0 ? <p className="text-muted-foreground text-center py-8">No sales data available</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesQuantityData}>
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

          <Card>
            <CardHeader><CardTitle>{granularityLabel} Product Sales Value</CardTitle></CardHeader>
            <CardContent>
              {salesValueData.length === 0 ? <p className="text-muted-foreground text-center py-8">No sales data available</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesValueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} name="Sales Value" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Product Sales Proportion</CardTitle></CardHeader>
              <CardContent>
                {productProportionData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={productProportionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {productProportionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} units (${props.payload.percentage}%)`, name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment Method Proportion</CardTitle></CardHeader>
              <CardContent>
                {paymentProportionData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={paymentProportionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {paymentProportionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} orders (${props.payload.percentage}%)`, name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Product Sales Ranking (Quantity & Value)</CardTitle></CardHeader>
            <CardContent>
              {productSalesBarData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
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
        </TabsContent>

        {/* Expense Tab */}
        <TabsContent value="expense" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Time Granularity</label>
              <Select value={expGranularity} onValueChange={(v) => setExpGranularity(v as TimeGranularity)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Category</label>
              <Select value={expCatFilter} onValueChange={setExpCatFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Fund Source</label>
              <Select value={expFundFilter} onValueChange={setExpFundFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Expense (filtered)</div>
              <div className="text-3xl font-bold">{formatCurrency(totalExpense)}</div>
            </CardContent>
          </Card>

          {/* Area Chart - Expense Trend */}
          <Card>
            <CardHeader><CardTitle>{expGranLabel} Expense Trend</CardTitle></CardHeader>
            <CardContent>
              {expenseTrendData.length === 0 ? <p className="text-muted-foreground text-center py-8">No expense data</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expenseTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="total" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} name="Expense" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stacked Bar - By Category */}
          <Card>
            <CardHeader><CardTitle>{expGranLabel} Expense by Category</CardTitle></CardHeader>
            <CardContent>
              {expenseByCategoryData.data.length === 0 ? <p className="text-muted-foreground text-center py-8">No expense data</p> : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={expenseByCategoryData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    {expenseByCategoryData.categories.map((cat, i) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Expense by Category</CardTitle></CardHeader>
              <CardContent>
                {expenseCatPieData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={expenseCatPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {expenseCatPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Expense by Fund Source</CardTitle></CardHeader>
              <CardContent>
                {expenseFundPieData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie data={expenseFundPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {expenseFundPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Other Income Tab */}
        <TabsContent value="income" className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Time Granularity</label>
              <Select value={incGranularity} onValueChange={(v) => setIncGranularity(v as TimeGranularity)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Fund Destination</label>
              <Select value={incFundFilter} onValueChange={setIncFundFilter}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Other Income (filtered)</div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          {/* Bar Chart - Income Trend (bar charts clearly show discrete income amounts per period) */}
          <Card>
            <CardHeader><CardTitle>{incGranLabel} Other Income Trend</CardTitle></CardHeader>
            <CardContent>
              {incomeTrendData.length === 0 ? <p className="text-muted-foreground text-center py-8">No income data</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#22c55e" name="Other Income" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - By Fund Destination */}
          <Card>
            <CardHeader><CardTitle>Income by Fund Destination</CardTitle></CardHeader>
            <CardContent>
              {incomeFundPieData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={incomeFundPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ percentage }) => `${percentage}%`}>
                      {incomeFundPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
