import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  customer_name: string;
  child_name: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  amount_paid: number;
}

interface ItemRow {
  order_id: string;
  product_name: string;
  quantity: number;
  product_price: number;
}

const netTotal = (o: OrderRow) =>
  Math.max(0, (o.subtotal || 0) + (o.tax_amount || 0) - (o.discount_amount || 0));
const netPaid = (o: OrderRow) => Math.min(Math.max(0, o.amount_paid || 0), netTotal(o));

export interface SalesDetailRow {
  productName: string;
  quantity: number;
  customerName: string;
  total: number;
  hasDiscount: boolean;
}

export interface OtherIncomeDetailRow {
  description: string;
  fundSource: string;
  date: string;
  amount: number;
}

export interface ReceivableDetailRow {
  productName: string;
  customerName: string;
  childName: string;
  outstanding: number;
}

export interface DiscountDetailRow {
  productName: string;
  customerName: string;
  childName: string;
  normalPrice: number;
  discount: number;
}

export interface DashboardDetails {
  sales: SalesDetailRow[];
  otherIncome: OtherIncomeDetailRow[];
  receivables: ReceivableDetailRow[];
  discounts: DiscountDetailRow[];
}

const empty: DashboardDetails = { sales: [], otherIncome: [], receivables: [], discounts: [] };

export const useDashboardDetails = (dateRange?: DateRange) => {
  const [details, setDetails] = useState<DashboardDetails>(empty);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [ordersRes, itemsRes, incRes, fundsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, status, customer_name, child_name, subtotal, tax_amount, discount_amount, amount_paid'),
        supabase.from('order_items').select('order_id, product_name, quantity, product_price'),
        supabase.from('other_income' as any).select('*'),
        supabase.from('expense_fund_sources' as any).select('id, name'),
      ]);

      const orders = (ordersRes.data as any as OrderRow[]) || [];
      const items = (itemsRes.data as any as ItemRow[]) || [];
      const otherIncomes = (incRes.data as any[]) || [];
      const fundSources = (fundsRes.data as any[]) || [];
      const fundMap: Record<string, string> = Object.fromEntries(fundSources.map((f) => [f.id, f.name]));

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

      const itemsByOrder: Record<string, ItemRow[]> = {};
      items.forEach((it) => {
        (itemsByOrder[it.order_id] ||= []).push(it);
      });

      const activeOrders = orders.filter(
        (o) => o.status !== 'cancelled' && o.status !== 'refund' && inRange(o.created_at),
      );

      // Sales detail: one row per product sold per order
      const sales: SalesDetailRow[] = [];
      activeOrders.forEach((o) => {
        const list = itemsByOrder[o.id] || [];
        const normalSubtotal = list.reduce(
          (s, it) => s + (it.product_price || 0) * (it.quantity || 0),
          0,
        );
        const orderDiscount = o.discount_amount || 0;
        list.forEach((it) => {
          const lineNormal = (it.product_price || 0) * (it.quantity || 0);
          // Allocate the order discount proportionally across its line items
          const lineDiscount =
            normalSubtotal > 0 ? (orderDiscount * lineNormal) / normalSubtotal : 0;
          sales.push({
            productName: it.product_name,
            quantity: it.quantity,
            customerName: o.customer_name,
            total: Math.max(0, lineNormal - lineDiscount),
            hasDiscount: orderDiscount > 0,
          });
        });
      });
      sales.sort((a, b) => a.customerName.localeCompare(b.customerName));

      // Discount detail: one row per order that received a discount
      const discounts: DiscountDetailRow[] = activeOrders
        .filter((o) => (o.discount_amount || 0) > 0)
        .map((o) => {
          const list = itemsByOrder[o.id] || [];
          const productName =
            list.length > 0 ? list.map((it) => it.product_name).join(', ') : '-';
          const normalPrice = list.reduce(
            (s, it) => s + (it.product_price || 0) * (it.quantity || 0),
            0,
          );
          return {
            productName,
            customerName: o.customer_name,
            childName: o.child_name || '-',
            normalPrice,
            discount: o.discount_amount || 0,
          };
        })
        .sort((a, b) => a.customerName.localeCompare(b.customerName));

      // Other income records
      const otherIncome: OtherIncomeDetailRow[] = otherIncomes
        .filter((i) => inRange(i.date))
        .map((i) => ({
          description: i.description || '-',
          fundSource: i.fund_source_id ? fundMap[i.fund_source_id] || 'Unknown' : '-',
          date: i.date,
          amount: i.amount || 0,
        }))
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      // Receivables: orders not fully paid -> products, customer, child
      const receivables: ReceivableDetailRow[] = [];
      activeOrders
        .filter((o) => netTotal(o) - netPaid(o) > 0)
        .forEach((o) => {
          const list = itemsByOrder[o.id] || [];
          if (list.length === 0) {
            receivables.push({
              productName: '-',
              customerName: o.customer_name,
              childName: o.child_name || '-',
              outstanding: netTotal(o) - netPaid(o),
            });
            return;
          }
          list.forEach((it, idx) => {
            receivables.push({
              productName: it.product_name,
              customerName: o.customer_name,
              childName: o.child_name || '-',
              // Show outstanding once per order on the first row to avoid double counting
              outstanding: idx === 0 ? netTotal(o) - netPaid(o) : 0,
            });
          });
        });
      receivables.sort((a, b) => a.customerName.localeCompare(b.customerName));

      setDetails({ sales, otherIncome, receivables, discounts });
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [dateRange?.from, dateRange?.to]);

  return { details, loading, fetchDetails };
};
