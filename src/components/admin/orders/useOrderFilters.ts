
import { useMemo } from "react";
import { DateRange } from "react-day-picker";

export function useOrderFilters(orders: any[], dateRange: DateRange | undefined) {
  // Defensive filter for well-formed orders
  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      if (dateRange?.from && dateRange?.to) {
        const orderDate = new Date(order.created_at);
        return (
          orderDate >= new Date(dateRange.from.setHours(0,0,0,0)) &&
          orderDate <= new Date(dateRange.to.setHours(23,59,59,999))
        );
      }
      return true;
    }).filter(order =>
      !!order && !!order.id && !!order.customer_name && !!order.customer_email && !!order.customer_phone
    );
  }, [orders, dateRange]);
  return filtered;
}
