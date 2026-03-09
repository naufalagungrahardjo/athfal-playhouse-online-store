
import { useMemo } from "react";
import { DateRange } from "react-day-picker";

export function useOrderFilters(orders: any[], dateRange: DateRange | undefined) {
  // Defensive filter for well-formed orders
  const filtered = useMemo(() => {
    if (!orders) return [];
      return orders.filter(order => {
      if (dateRange?.from && dateRange?.to) {
        const orderDate = new Date(order.created_at);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      }
      return true;
    }).filter(order =>
      !!order && !!order.id && !!order.customer_name && !!order.customer_email && !!order.customer_phone
    );
  }, [orders, dateRange]);
  return filtered;
}
