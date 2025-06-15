
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// Returns CSV string for a given set of orders and date range
export function exportOrdersToCSV(filteredOrders: any[], dateRange: DateRange | undefined) {
  const headers = [
    "Order ID","Created At","Status","Customer Name","Customer Email","Customer Phone",
    "Customer Address","Payment Method","Subtotal","Tax","Discount","Promo Code",
    "Total","Notes","Order Items",
  ];
  const rows = filteredOrders.map(order => [
    order.id, order.created_at, order.status, order.customer_name,
    order.customer_email, order.customer_phone, order.customer_address || "",
    order.payment_method, order.subtotal, order.tax_amount,
    order.discount_amount || "", order.promo_code || "", order.total_amount,
    order.notes || "",
    (order.items ?? [])
      .map(item => `${item.product_name} (x${item.quantity}; ${item.product_price})`)
      .join(" | ")
  ]);
  const csvString = [
    headers.join(","),
    ...rows.map(row => row.map(field => {
      if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n')))
        return `"${field.replace(/"/g, '""')}"`;
      return field;
    }).join(',')),
  ].join('\r\n');
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateInfo = dateRange?.from && dateRange?.to
    ? `_from_${format(dateRange.from, "yyyyMMdd")}_to_${format(dateRange.to, "yyyyMMdd")}` : "";
  a.download = `orders${dateInfo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
