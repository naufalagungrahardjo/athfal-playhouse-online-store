import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

interface OrderRow {
  created_at: string;
  payment_method: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  amount_paid: number;
}

// Net value of the sale (discount removed). Discounts are never revenue.
const getNetTotal = (o: OrderRow) =>
  Math.max(0, (o.subtotal || 0) + (o.tax_amount || 0) - (o.discount_amount || 0));
const getNetPaid = (o: OrderRow) =>
  Math.min(Math.max(0, o.amount_paid || 0), getNetTotal(o));
const getPaidRatio = (o: OrderRow) => {
  const nt = getNetTotal(o);
  if (nt <= 0) return 0;
  return Math.min(1, Math.max(0, getNetPaid(o) / nt));
};
// Sales revenue, before tax, cash basis (paid ratio applied, discount excluded)
const getOrderRevenue = (o: OrderRow) =>
  Math.max(0, (o.subtotal || 0) - (o.discount_amount || 0)) * getPaidRatio(o);

const getExpenseNet = (e: any) => (e.amount || 0) - (e.discount || 0);

export interface FundBalanceRow {
  name: string;
  salesIn: number;
  otherIn: number;
  capitalIn: number;
  transferIn: number;
  transferOut: number;
  totalIn: number;
  expenseOut: number;
  net: number;
}

export interface FinancialSummary {
  salesRevenue: number;
  otherIncome: number;
  capitalInflow: number;
  totalExpenses: number;
  netIncome: number;     // includes capital
  targetToBEP: number;   // excludes capital
  bankBalance: number;   // accumulation of all fund Net Balance
  fundBalance: FundBalanceRow[];
}

const emptySummary: FinancialSummary = {
  salesRevenue: 0,
  otherIncome: 0,
  capitalInflow: 0,
  totalExpenses: 0,
  netIncome: 0,
  targetToBEP: 0,
  bankBalance: 0,
  fundBalance: [],
};

export const useFinancialSummary = (dateRange?: DateRange) => {
  const [summary, setSummary] = useState<FinancialSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const [ordersRes, expRes, fundsRes, incRes, capRes] = await Promise.all([
        supabase.from('orders').select('created_at, payment_method, status, subtotal, tax_amount, discount_amount, amount_paid'),
        supabase.from('expenses' as any).select('*'),
        supabase.from('expense_fund_sources' as any).select('id, name'),
        supabase.from('other_income' as any).select('*'),
        supabase.from('capital_inflows' as any).select('*'),
      ]);

      const orders = (ordersRes.data as any as OrderRow[]) || [];
      const expenses = (expRes.data as any[]) || [];
      const fundSources = (fundsRes.data as any[]) || [];
      const otherIncomes = (incRes.data as any[]) || [];
      const capitalInflows = (capRes.data as any[]) || [];

      const expFundMap: Record<string, string> = Object.fromEntries(fundSources.map((f) => [f.id, f.name]));

      const inRange = (dateStr: string) => {
        if (!dateRange?.from) return true;
        const d = new Date(dateStr);
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (d < from) return false;
        if (dateRange.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
        return true;
      };

      const activeOrders = orders.filter(
        (o) => o.status !== 'cancelled' && o.status !== 'refund' && inRange(o.created_at),
      );

      const salesRevenue = activeOrders.reduce((s, o) => s + getOrderRevenue(o), 0);
      const otherIncome = otherIncomes.filter((i) => inRange(i.date)).reduce((s, i) => s + (i.amount || 0), 0);
      const capitalInflow = capitalInflows
        .filter((c) => (c.type || 'inflow') !== 'transfer')
        .filter((c) => inRange(c.date))
        .reduce((s, c) => s + (c.amount || 0), 0);
      const totalExpenses = expenses.filter((e) => inRange(e.date)).reduce((s, e) => s + getExpenseNet(e), 0);

      const netIncome = salesRevenue + otherIncome + capitalInflow - totalExpenses;
      const targetToBEP = salesRevenue + otherIncome - totalExpenses;

      // === Fund Balance Breakdown ===
      const balanceMap: Record<string, Omit<FundBalanceRow, 'name' | 'totalIn' | 'net'>> = {};
      const ensure = (name: string) => {
        if (!balanceMap[name]) {
          balanceMap[name] = { salesIn: 0, otherIn: 0, capitalIn: 0, transferIn: 0, transferOut: 0, expenseOut: 0 };
        }
      };
      Object.values(expFundMap).forEach((name) => { if (name) ensure(name); });

      activeOrders.forEach((o) => {
        const method = o.payment_method || 'Unknown';
        ensure(method);
        balanceMap[method].salesIn += getOrderRevenue(o);
      });
      otherIncomes.filter((i) => inRange(i.date)).forEach((i) => {
        const name = i.fund_source_id ? (expFundMap[i.fund_source_id] || 'Unknown') : 'Unknown';
        ensure(name);
        balanceMap[name].otherIn += i.amount || 0;
      });
      capitalInflows.filter((c) => inRange(c.date)).forEach((c) => {
        const entryType = c.type || 'inflow';
        if (entryType === 'transfer') {
          const fromName = c.from_fund_source_id ? (expFundMap[c.from_fund_source_id] || 'Unknown') : 'Unknown';
          const toName = c.fund_source_id ? (expFundMap[c.fund_source_id] || 'Unknown') : 'Unknown';
          ensure(fromName);
          ensure(toName);
          balanceMap[fromName].transferOut += c.amount || 0;
          balanceMap[toName].transferIn += c.amount || 0;
          return;
        }
        const name = c.fund_source_id ? (expFundMap[c.fund_source_id] || 'Unknown') : 'Unknown';
        ensure(name);
        balanceMap[name].capitalIn += c.amount || 0;
      });
      expenses.filter((e) => inRange(e.date)).forEach((e) => {
        const name = e.fund_source_id ? (expFundMap[e.fund_source_id] || 'Unknown') : 'Unknown';
        ensure(name);
        balanceMap[name].expenseOut += getExpenseNet(e);
      });

      const fundBalance: FundBalanceRow[] = Object.entries(balanceMap)
        .map(([name, v]) => ({
          name,
          ...v,
          totalIn: v.salesIn + v.otherIn + v.capitalIn + v.transferIn,
          net: v.salesIn + v.otherIn + v.capitalIn + v.transferIn - v.transferOut - v.expenseOut,
        }))
        .sort((a, b) => b.net - a.net);

      const bankBalance = fundBalance.reduce((s, d) => s + d.net, 0);

      setSummary({
        salesRevenue,
        otherIncome,
        capitalInflow,
        totalExpenses,
        netIncome,
        targetToBEP,
        bankBalance,
        fundBalance,
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange?.from, dateRange?.to]);

  return { summary, loading, fetchSummary };
};
