import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Trash2, CalendarDays, User, DollarSign } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { formatCurrency } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { OrderStatistics } from "@/components/admin/OrderStatistics";
import { OrderFilterToolbar } from "@/components/admin/OrderFilterToolbar";
import { OrderListItem } from "@/components/admin/OrderListItem";

const AdminOrders = () => {
  const { orders, loading, fetchOrders, deleteOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleViewDetails = (order: any) => {
    if (!order || typeof order !== 'object') {
      console.error('Tried to view details of invalid order:', order);
      return;
    }
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setIsDetailsOpen(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    await deleteOrder(orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  // Filter orders by date
  const filteredOrders = orders.filter(order => {
    if (dateRange?.from && dateRange?.to) {
      const orderDate = new Date(order.created_at);
      return (
        orderDate >= new Date(dateRange.from.setHours(0,0,0,0)) &&
        orderDate <= new Date(dateRange.to.setHours(23,59,59,999))
      );
    }
    return true;
  }).filter(order => {
    // Defensive: ensure order has id, customer_name, customer_email, customer_phone
    if (!order || !order.id || !order.customer_name || !order.customer_email || !order.customer_phone) {
      console.warn('Filtered out malformed order:', order);
      return false;
    }
    return true;
  });

  // CSV Export
  const exportOrdersToCSV = () => {
    // CSV Header
    const headers = [
      "Order ID",
      "Created At",
      "Status",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Customer Address",
      "Payment Method",
      "Subtotal",
      "Tax",
      "Discount",
      "Promo Code",
      "Total",
      "Notes",
      "Order Items",
    ];

    // Flatten order items for csv (as a text field)
    const rows = filteredOrders.map(order => [
      order.id,
      order.created_at,
      order.status,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.customer_address || "",
      order.payment_method,
      order.subtotal,
      order.tax_amount,
      order.discount_amount || "",
      order.promo_code || "",
      order.total_amount,
      (order.notes || ""),
      (order.items ?? [])
        .map(item => `${item.product_name} (x${item.quantity}; ${item.product_price})`)
        .join(" | "),
    ]);

    const csvString = [
      headers.join(","),
      ...rows.map(row => row.map(field => {
        // Escape commas and quotes
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')),
    ].join('\r\n');

    // Download
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const dateInfo = dateRange.from && dateRange.to
      ? `_from_${format(dateRange.from, "yyyyMMdd")}_to_${format(dateRange.to, "yyyyMMdd")}`
      : "";
    a.download = `orders${dateInfo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="text-center py-12">
          <div>Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrderFilterToolbar
        dateRange={dateRange}
        setDateRange={setDateRange}
        onRefresh={fetchOrders}
        onExport={exportOrdersToCSV}
      />

      <OrderStatistics
        orders={orders}
        getStatusCount={getStatusCount}
      />

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found{(dateRange?.from && dateRange?.to) ? " in selected range" : ""}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) =>
                order && order.id ? (
                  <OrderListItem
                    key={order.id}
                    order={order}
                    getStatusColor={getStatusColor}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDeleteOrder}
                  />
                ) : null
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only render OrderDetailsDialog when selectedOrder is not null and valid */}
      {selectedOrder && selectedOrder.id && (
        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
};

export default AdminOrders;
