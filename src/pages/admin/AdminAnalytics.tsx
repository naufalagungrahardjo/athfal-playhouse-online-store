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
import { useIsMobile } from '@/hooks/use-mobile';
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

type RevenueType = 'before_tax' | 'after_tax' | 'after_discount';

interface OrderWithItems {
  id: string;
  created_at: string;
  payment_method: string;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  items: { product_id: string; product_name: string; quantity: number; product_price: number }[];
}

const getOrderRevenue = (order: OrderWithItems, revenueType: RevenueType): number => {
  switch (revenueType) {
    case 'before_tax': return order.subtotal || 0;
    case 'after_tax': return (order.subtotal || 0) + (order.tax_amount || 0);
    case 'after_discount': return (order.subtotal || 0) - (order.discount_amount || 0);
  }
};

const revenueTypeLabels: Record<RevenueType, string> = {
  before_tax: 'Revenue Before Tax',
  after_tax: 'Revenue After Tax',
  after_discount: 'Revenue After Discount',
};

type ExpenseRow = { id: string; description: string; category_id: string | null; fund_source_id: string | null; amount: number; date: string };
type ExpenseCategory = { id: string; name: string };
type FundSource = { id: string; name: string };
type OtherIncomeRow = { id: string; description: string; amount: number; fund_source_id: string | null; date: string };
type CapitalRow = { id: string; detail: string; amount: number; fund_source_id: string | null; date: string };

const formatDateKey = (dateStr: string, granularity: TimeGranularity): string => {
  const d = new Date(dateStr);
  switch (granularity) {
    case 'daily': return format(d, 'yyyy-MM-dd');
    case 'monthly': return format(d, 'yyyy-MM');
    case 'yearly': return format(d, 'yyyy');
  }
};

const AdminAnalytics = () => {
  const isMobile = useIsMobile();
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

  // Capital data
  const [capitalInflows, setCapitalInflows] = useState<CapitalRow[]>([]);
  const [capGranularity, setCapGranularity] = useState<TimeGranularity>('monthly');
  const [capFundFilter, setCapFundFilter] = useState('all');

  // Net Income
  const [netGranularity, setNetGranularity] = useState<TimeGranularity>('monthly');
  const [includeCapital, setIncludeCapital] = useState(false);

  // Revenue type filter (shared for Sales & Net Income)
  const [salesRevenueType, setSalesRevenueType] = useState<RevenueType>('before_tax');
  const [netRevenueType, setNetRevenueType] = useState<RevenueType>('before_tax');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [ordersRes, itemsRes, catsRes, prodsRes, expRes, expCatsRes, fundsRes, incRes, capRes] = await Promise.all([
        supabase.from('orders').select('id, created_at, payment_method, status, total_amount, subtotal, tax_amount, discount_amount').order('created_at', { ascending: true }),
        supabase.from('order_items').select('order_id, product_id, product_name, quantity, product_price'),
        supabase.from('categories').select('slug, title'),
        supabase.from('products').select('product_id, category'),
        supabase.from('expenses' as any).select('*').order('date', { ascending: true }),
        supabase.from('expense_categories' as any).select('id, name'),
        supabase.from('expense_fund_sources' as any).select('id, name'),
        supabase.from('other_income' as any).select('*').order('date', { ascending: true }),
        supabase.from('capital_inflows' as any).select('*').order('date', { ascending: true }),
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
      setCapitalInflows((capRes.data as any) || []);
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
        if (order.status === 'cancelled' || order.status === 'refund') return false;
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
      const val = getOrderRevenue(order, salesRevenueType);
      map[key] = (map[key] || 0) + val;
    });
    return Object.entries(map).sort().map(([date, value]) => ({ date, value }));
  }, [filteredOrders, salesRevenueType, timeGranularity]);

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

  // === Capital analytics ===
  const filteredCapitals = useMemo(() => {
    return capitalInflows.filter(c => {
      if (capFundFilter !== 'all' && c.fund_source_id !== capFundFilter) return false;
      return true;
    });
  }, [capitalInflows, capFundFilter]);

  const capitalTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCapitals.forEach(c => {
      const key = formatDateKey(c.date, capGranularity);
      map[key] = (map[key] || 0) + c.amount;
    });
    return Object.entries(map).sort().map(([date, total]) => ({ date, total }));
  }, [filteredCapitals, capGranularity]);

  // Capital by investor (detail text) - pie
  const capitalByInvestorData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCapitals.forEach(c => {
      // Extract investor name (first part before " - " if present)
      const investor = c.detail.includes(' - ') ? c.detail.split(' - ')[0].trim() : c.detail.trim();
      map[investor] = (map[investor] || 0) + c.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCapitals]);

  // Capital by fund destination - pie
  const capitalByFundData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCapitals.forEach(c => {
      const fundName = c.fund_source_id ? (expFundMap[c.fund_source_id] || 'Unknown') : 'Unknown';
      map[fundName] = (map[fundName] || 0) + c.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCapitals, expFundMap]);

  // Capital by investor over time - stacked bar
  const capitalByInvestorTimeData = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    const investors = new Set<string>();
    filteredCapitals.forEach(c => {
      const key = formatDateKey(c.date, capGranularity);
      const investor = c.detail.includes(' - ') ? c.detail.split(' - ')[0].trim() : c.detail.trim();
      investors.add(investor);
      if (!dateMap[key]) dateMap[key] = {};
      dateMap[key][investor] = (dateMap[key][investor] || 0) + c.amount;
    });
    const sortedDates = Object.keys(dateMap).sort();
    return { data: sortedDates.map(date => ({ date, ...dateMap[date] })), investors: Array.from(investors) };
  }, [filteredCapitals, capGranularity]);

  // Cumulative capital over time
  const cumulativeCapitalData = useMemo(() => {
    let cumulative = 0;
    return capitalTrendData.map(d => {
      cumulative += d.total;
      return { date: d.date, cumulative };
    });
  }, [capitalTrendData]);

  const totalCapital = useMemo(() => filteredCapitals.reduce((s, c) => s + c.amount, 0), [filteredCapitals]);

  // === Net Income analytics ===
  // Use all non-cancelled orders for net income (no category/status filter)
  const totalSalesRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'refund')
      .reduce((s, o) => s + getOrderRevenue(o, netRevenueType), 0);
  }, [orders, netRevenueType]);

  const totalOtherIncome = useMemo(() => otherIncomes.reduce((s, i) => s + i.amount, 0), [otherIncomes]);
  const totalAllExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalAllCapital = useMemo(() => capitalInflows.reduce((s, c) => s + c.amount, 0), [capitalInflows]);
  const effectiveOtherIncome = includeCapital ? totalOtherIncome + totalAllCapital : totalOtherIncome;
  const netIncome = totalSalesRevenue + effectiveOtherIncome - totalAllExpenses;

  const netGranLabel = netGranularity === 'daily' ? 'Daily' : netGranularity === 'monthly' ? 'Monthly' : 'Yearly';

  // Revenue vs Expense over time (grouped bar)
  const revenueVsExpenseData = useMemo(() => {
    const map: Record<string, { revenue: number; expense: number; net: number }> = {};
    // Sales revenue
    orders.filter(o => o.status !== 'cancelled' && o.status !== 'refund').forEach(o => {
      const key = formatDateKey(o.created_at, netGranularity);
      if (!map[key]) map[key] = { revenue: 0, expense: 0, net: 0 };
      map[key].revenue += getOrderRevenue(o, netRevenueType);
    });
    // Other income
    otherIncomes.forEach(i => {
      const key = formatDateKey(i.date, netGranularity);
      if (!map[key]) map[key] = { revenue: 0, expense: 0, net: 0 };
      map[key].revenue += i.amount;
    });
    // Capital (if included)
    if (includeCapital) {
      capitalInflows.forEach(c => {
        const key = formatDateKey(c.date, netGranularity);
        if (!map[key]) map[key] = { revenue: 0, expense: 0, net: 0 };
        map[key].revenue += c.amount;
      });
    }
    // Expenses
    expenses.forEach(e => {
      const key = formatDateKey(e.date, netGranularity);
      if (!map[key]) map[key] = { revenue: 0, expense: 0, net: 0 };
      map[key].expense += e.amount;
    });
    // Calculate net
    Object.values(map).forEach(v => { v.net = v.revenue - v.expense; });
    return Object.entries(map).sort().map(([date, vals]) => ({ date, ...vals }));
  }, [orders, otherIncomes, expenses, capitalInflows, includeCapital, netGranularity, netRevenueType]);

  // Cumulative net income over time
  const cumulativeNetData = useMemo(() => {
    let cumulative = 0;
    return revenueVsExpenseData.map(d => {
      cumulative += d.net;
      return { date: d.date, cumulative };
    });
  }, [revenueVsExpenseData]);

  // Revenue composition pie
  const revenueCompositionData = useMemo(() => {
    const data = [
      { name: 'Sales Revenue', value: totalSalesRevenue },
      { name: 'Other Income', value: totalOtherIncome },
      ...(includeCapital ? [{ name: 'Capital Inflow', value: totalAllCapital }] : []),
    ].filter(d => d.value > 0);
    const total = data.reduce((s, d) => s + d.value, 0);
    return data.map(d => ({ ...d, percentage: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0' }));
  }, [totalSalesRevenue, totalOtherIncome, totalAllCapital, includeCapital]);

  // === Fund Balance Breakdown ===
  const fundBalanceData = useMemo(() => {
    const balanceMap: Record<string, { salesIn: number; otherIn: number; capitalIn: number; expenseOut: number }> = {};

    const ensure = (name: string) => {
      if (!balanceMap[name]) balanceMap[name] = { salesIn: 0, otherIn: 0, capitalIn: 0, expenseOut: 0 };
    };

    // Sales revenue by payment_method
    orders.filter(o => o.status !== 'cancelled' && o.status !== 'refund').forEach(o => {
      const method = o.payment_method || 'Unknown';
      ensure(method);
      balanceMap[method].salesIn += getOrderRevenue(o, netRevenueType);
    });

    // Other income by fund_source_id
    otherIncomes.forEach(i => {
      const name = i.fund_source_id ? (expFundMap[i.fund_source_id] || 'Unknown') : 'Unknown';
      ensure(name);
      balanceMap[name].otherIn += i.amount;
    });

    // Capital by fund_source_id (if included)
    if (includeCapital) {
      capitalInflows.forEach(c => {
        const name = c.fund_source_id ? (expFundMap[c.fund_source_id] || 'Unknown') : 'Unknown';
        ensure(name);
        balanceMap[name].capitalIn += c.amount;
      });
    }

    // Expenses by fund_source_id
    expenses.forEach(e => {
      const name = e.fund_source_id ? (expFundMap[e.fund_source_id] || 'Unknown') : 'Unknown';
      ensure(name);
      balanceMap[name].expenseOut += e.amount;
    });

    return Object.entries(balanceMap)
      .map(([name, v]) => ({
        name,
        salesIn: v.salesIn,
        otherIn: v.otherIn,
        capitalIn: v.capitalIn,
        totalIn: v.salesIn + v.otherIn + v.capitalIn,
        expenseOut: v.expenseOut,
        net: v.salesIn + v.otherIn + v.capitalIn - v.expenseOut,
      }))
      .sort((a, b) => b.net - a.net);
  }, [orders, otherIncomes, expenses, capitalInflows, includeCapital, expFundMap, netRevenueType]);

  // Fund balance pie (net positive only)
  const fundBalancePieData = useMemo(() => {
    const positive = fundBalanceData.filter(d => d.totalIn > 0 || d.expenseOut > 0);
    const totalNet = positive.reduce((s, d) => s + Math.max(0, d.net), 0);
    return positive
      .filter(d => d.net > 0)
      .map(d => ({ name: d.name, value: d.net, percentage: totalNet > 0 ? ((d.net / totalNet) * 100).toFixed(1) : '0' }));
  }, [fundBalanceData]);

  const granularityLabel = timeGranularity === 'daily' ? 'Daily' : timeGranularity === 'monthly' ? 'Monthly' : 'Yearly';
  const expGranLabel = expGranularity === 'daily' ? 'Daily' : expGranularity === 'monthly' ? 'Monthly' : 'Yearly';
  const incGranLabel = incGranularity === 'daily' ? 'Daily' : incGranularity === 'monthly' ? 'Monthly' : 'Yearly';
  const capGranLabel = capGranularity === 'daily' ? 'Daily' : capGranularity === 'monthly' ? 'Monthly' : 'Yearly';

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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="income">Other Income</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
          <TabsTrigger value="net">Net Income</TabsTrigger>
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
            <div>
              <label className="text-sm font-medium block mb-1">Revenue Type</label>
              <Select value={salesRevenueType} onValueChange={(v) => setSalesRevenueType(v as RevenueType)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_tax">Revenue Before Tax</SelectItem>
                  <SelectItem value="after_tax">Revenue After Tax</SelectItem>
                  <SelectItem value="after_discount">Revenue After Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>{granularityLabel} Product Sales Quantity</CardTitle></CardHeader>
            <CardContent>
              {salesQuantityData.length === 0 ? <p className="text-muted-foreground text-center py-8">No sales data available</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <LineChart data={salesQuantityData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 35 : 60} />
                    <Tooltip />
                    <Line type="monotone" dataKey="quantity" stroke="#8884d8" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="Quantity Sold" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{granularityLabel} {revenueTypeLabels[salesRevenueType]}</CardTitle></CardHeader>
            <CardContent>
              {salesValueData.length === 0 ? <p className="text-muted-foreground text-center py-8">No sales data available</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <LineChart data={salesValueData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="Sales Value" />
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
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={productProportionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {productProportionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} units (${props.payload.percentage}%)`, name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Payment Method Proportion</CardTitle></CardHeader>
              <CardContent>
                {paymentProportionData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={paymentProportionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {paymentProportionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} orders (${props.payload.percentage}%)`, name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
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
                <ResponsiveContainer width="100%" height={Math.max(300, productSalesBarData.length * (isMobile ? 50 : 40))}>
                  <BarChart data={productSalesBarData} layout="vertical" margin={{ left: isMobile ? 10 : 120 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 12 }} tickFormatter={isMobile ? (v) => `${(v / 1000).toFixed(0)}k` : undefined} />
                    <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 9 : 11 }} />
                    <Tooltip formatter={(value: number, name: string) => name === 'value' ? formatCurrency(value) : value} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
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
              <div className="text-xl sm:text-3xl font-bold truncate">{formatCurrency(totalExpense)}</div>
            </CardContent>
          </Card>

          {/* Area Chart - Expense Trend */}
          <Card>
            <CardHeader><CardTitle>{expGranLabel} Expense Trend</CardTitle></CardHeader>
            <CardContent>
              {expenseTrendData.length === 0 ? <p className="text-muted-foreground text-center py-8">No expense data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <AreaChart data={expenseTrendData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
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
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                  <BarChart data={expenseByCategoryData.data} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
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
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={expenseCatPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {expenseCatPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Expense by Fund Source</CardTitle></CardHeader>
              <CardContent>
                {expenseFundPieData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={expenseFundPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {expenseFundPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
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
              <div className="text-xl sm:text-3xl font-bold text-green-600 truncate">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          {/* Bar Chart - Income Trend (bar charts clearly show discrete income amounts per period) */}
          <Card>
            <CardHeader><CardTitle>{incGranLabel} Other Income Trend</CardTitle></CardHeader>
            <CardContent>
              {incomeTrendData.length === 0 ? <p className="text-muted-foreground text-center py-8">No income data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <BarChart data={incomeTrendData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
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
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={incomeFundPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {incomeFundPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Net Income Tab */}
        <TabsContent value="net" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="text-xs sm:text-sm text-muted-foreground">Sales Revenue</div>
                <div className="text-base sm:text-2xl font-bold truncate">{formatCurrency(totalSalesRevenue)}</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="text-xs sm:text-sm text-muted-foreground">Other Income</div>
                <div className="text-base sm:text-2xl font-bold truncate">{formatCurrency(totalOtherIncome)}</div>
              </CardContent>
            </Card>
            {includeCapital && (
              <Card className="overflow-hidden">
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  <div className="text-xs sm:text-sm text-muted-foreground">Capital Inflow</div>
                  <div className="text-base sm:text-2xl font-bold truncate">{formatCurrency(totalAllCapital)}</div>
                </CardContent>
              </Card>
            )}
            <Card className="overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-base sm:text-2xl font-bold text-destructive truncate">{formatCurrency(totalAllExpenses)}</div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="text-xs sm:text-sm text-muted-foreground">Net Income</div>
                <div className={`text-base sm:text-2xl font-bold truncate ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {netIncome < 0 ? '-' : ''}{formatCurrency(Math.abs(netIncome))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Granularity & Revenue Type & Capital Filter */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Time Granularity</label>
              <Select value={netGranularity} onValueChange={(v) => setNetGranularity(v as TimeGranularity)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Revenue Type</label>
              <Select value={netRevenueType} onValueChange={(v) => setNetRevenueType(v as RevenueType)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_tax">Revenue Before Tax</SelectItem>
                  <SelectItem value="after_tax">Revenue After Tax</SelectItem>
                  <SelectItem value="after_discount">Revenue After Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Capital Inflow</label>
              <Select value={includeCapital ? 'include' : 'exclude'} onValueChange={(v) => setIncludeCapital(v === 'include')}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclude">Exclude Capital</SelectItem>
                  <SelectItem value="include">Include Capital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grouped Bar: Revenue vs Expense */}
          <Card>
            <CardHeader><CardTitle>{netGranLabel} Revenue vs Expense</CardTitle></CardHeader>
            <CardContent>
              {revenueVsExpenseData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                  <BarChart data={revenueVsExpenseData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue (Sales + Other)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Area: Net Income per period */}
          <Card>
            <CardHeader><CardTitle>{netGranLabel} Net Income</CardTitle></CardHeader>
            <CardContent>
              {revenueVsExpenseData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <AreaChart data={revenueVsExpenseData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <defs>
                      <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="net" stroke="#6366f1" fill="url(#netGradient)" strokeWidth={2} name="Net Income" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cumulative Net Income */}
          <Card>
            <CardHeader><CardTitle>Cumulative Net Income</CardTitle></CardHeader>
            <CardContent>
              {cumulativeNetData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <LineChart data={cumulativeNetData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="cumulative" stroke="#0ea5e9" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="Cumulative Net" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue Composition Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Revenue Composition</CardTitle></CardHeader>
              <CardContent>
                {revenueCompositionData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                    <PieChart>
                      <Pie data={revenueCompositionData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {revenueCompositionData.map((_, i) => <Cell key={i} fill={['#22c55e', '#0ea5e9'][i]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Money Flow Summary</CardTitle></CardHeader>
              <CardContent className="flex flex-col justify-center h-auto sm:h-[350px] space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <span className="text-xs sm:text-sm font-medium">Sales Revenue</span>
                  <span className="font-bold text-green-600 text-xs sm:text-base truncate ml-2">{formatCurrency(totalSalesRevenue)}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <span className="text-xs sm:text-sm font-medium">+ Other Income</span>
                  <span className="font-bold text-blue-600 text-xs sm:text-base truncate ml-2">{formatCurrency(totalOtherIncome)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center p-2 sm:p-3">
                  <span className="text-xs sm:text-sm font-medium">Total Revenue</span>
                  <span className="font-bold text-xs sm:text-base truncate ml-2">{formatCurrency(totalSalesRevenue + totalOtherIncome)}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <span className="text-xs sm:text-sm font-medium">- Total Expenses</span>
                  <span className="font-bold text-destructive text-xs sm:text-base truncate ml-2">{formatCurrency(totalAllExpenses)}</span>
                </div>
                <div className={`border-t-2 pt-2 flex justify-between items-center p-2 sm:p-3 rounded-lg ${netIncome >= 0 ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'}`}>
                  <span className="font-semibold text-xs sm:text-base">Net Income</span>
                  <span className={`text-sm sm:text-xl font-bold truncate ml-2 ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {netIncome < 0 ? '-' : ''}{formatCurrency(Math.abs(netIncome))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fund Balance Breakdown */}
          <Card>
            <CardHeader><CardTitle>💰 Fund Balance by Source / Bank</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Where your money sits: inflows from sales & other income vs outflows from expenses per fund source.</p>
              {fundBalanceData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <div className="overflow-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-muted-foreground">Fund Source / Bank</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Sales In</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Other Income In</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Total In</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Expense Out</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Net Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundBalanceData.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3 text-right text-green-600">{row.salesIn > 0 ? formatCurrency(row.salesIn) : '-'}</td>
                          <td className="p-3 text-right text-blue-600">{row.otherIn > 0 ? formatCurrency(row.otherIn) : '-'}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(row.totalIn)}</td>
                          <td className="p-3 text-right text-destructive">{row.expenseOut > 0 ? formatCurrency(row.expenseOut) : '-'}</td>
                          <td className={`p-3 text-right font-bold ${row.net >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {row.net < 0 ? '-' : ''}{formatCurrency(Math.abs(row.net))}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 font-bold">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right text-green-600">{formatCurrency(fundBalanceData.reduce((s, d) => s + d.salesIn, 0))}</td>
                        <td className="p-3 text-right text-blue-600">{formatCurrency(fundBalanceData.reduce((s, d) => s + d.otherIn, 0))}</td>
                        <td className="p-3 text-right">{formatCurrency(fundBalanceData.reduce((s, d) => s + d.totalIn, 0))}</td>
                        <td className="p-3 text-right text-destructive">{formatCurrency(fundBalanceData.reduce((s, d) => s + d.expenseOut, 0))}</td>
                        <td className={`p-3 text-right ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                          {netIncome < 0 ? '-' : ''}{formatCurrency(Math.abs(netIncome))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fund Balance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stacked bar: inflow vs outflow per fund */}
            <Card>
              <CardHeader><CardTitle>Inflow vs Outflow by Fund</CardTitle></CardHeader>
              <CardContent>
                {fundBalanceData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                    <BarChart data={fundBalanceData} layout="vertical" margin={{ left: isMobile ? 10 : 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 9 : 12 }} />
                      <YAxis type="category" dataKey="name" width={isMobile ? 70 : 120} tick={{ fontSize: isMobile ? 9 : 11 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                      <Bar dataKey="totalIn" fill="#22c55e" name="Total Inflow" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="expenseOut" fill="#ef4444" name="Expense Outflow" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Net balance distribution pie */}
            <Card>
              <CardHeader><CardTitle>Net Balance Distribution</CardTitle></CardHeader>
              <CardContent>
                {fundBalancePieData.length === 0 ? <p className="text-muted-foreground text-center py-8">No positive balances</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                    <PieChart>
                      <Pie data={fundBalancePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {fundBalancePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capital Tab */}
        <TabsContent value="capital" className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Time Granularity</label>
              <Select value={capGranularity} onValueChange={(v) => setCapGranularity(v as TimeGranularity)}>
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
              <Select value={capFundFilter} onValueChange={setCapFundFilter}>
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
              <div className="text-sm text-muted-foreground">Total Capital Inflow (filtered)</div>
              <div className="text-xl sm:text-3xl font-bold text-indigo-600 truncate">{formatCurrency(totalCapital)}</div>
            </CardContent>
          </Card>

          {/* Bar Chart - Capital Inflow Trend */}
          <Card>
            <CardHeader><CardTitle>{capGranLabel} Capital Inflow Trend</CardTitle></CardHeader>
            <CardContent>
              {capitalTrendData.length === 0 ? <p className="text-muted-foreground text-center py-8">No capital data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <BarChart data={capitalTrendData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#6366f1" name="Capital Inflow" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stacked Bar - Capital by Investor over Time */}
          <Card>
            <CardHeader><CardTitle>{capGranLabel} Capital by Investor</CardTitle></CardHeader>
            <CardContent>
              {capitalByInvestorTimeData.data.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                  <BarChart data={capitalByInvestorTimeData.data} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                    {capitalByInvestorTimeData.investors.map((inv, i) => (
                      <Bar key={inv} dataKey={inv} stackId="a" fill={COLORS[i % COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cumulative Capital Line */}
          <Card>
            <CardHeader><CardTitle>Cumulative Capital Inflow</CardTitle></CardHeader>
            <CardContent>
              {cumulativeCapitalData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <LineChart data={cumulativeCapitalData} margin={isMobile ? { left: -10, right: 10 } : undefined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 30} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} name="Cumulative Capital" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Capital by Investor</CardTitle></CardHeader>
              <CardContent>
                {capitalByInvestorData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={capitalByInvestorData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {capitalByInvestorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Capital by Fund Destination</CardTitle></CardHeader>
              <CardContent>
                {capitalByFundData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data</p> : (
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                    <PieChart>
                      <Pie data={capitalByFundData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={isMobile ? 30 : 50} outerRadius={isMobile ? 70 : 110} paddingAngle={2} label={renderCustomLabel} labelLine={false}>
                        {capitalByFundData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, _: string, props: any) => [formatCurrency(value) + ` (${props.payload.percentage}%)`, props.payload.name]} />
                      <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, paddingTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
