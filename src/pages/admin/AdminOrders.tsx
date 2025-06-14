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

const AdminOrders = () => {
  const { orders, loading, fetchOrders, deleteOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleViewDetails = (order: any) => {
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
    if (dateRange.from && dateRange.to) {
      // Assume order.created_at is a string (ISO format)
      const orderDate = new Date(order.created_at);
      // Include start and end date
      return (
        orderDate >= new Date(dateRange.from.setHours(0,0,0,0)) &&
        orderDate <= new Date(dateRange.to.setHours(23,59,59,999))
      );
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={(!dateRange.from || !dateRange.to) ? "text-muted-foreground" : ""}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                    : "Select Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {(dateRange.from && dateRange.to) && (
              <Button
                variant="ghost"
                onClick={() => setDateRange({from: undefined, to: undefined})}
                className="text-xs text-gray-500"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchOrders} variant="outline">
            Refresh Orders
          </Button>
          <Button onClick={exportOrdersToCSV} variant="default">
            Export Orders as CSV
          </Button>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <User className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getStatusCount('pending')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getStatusCount('completed')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found{(dateRange.from && dateRange.to) ? " in selected range" : ""}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">#{order.id.slice(0, 8)}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Customer:</span> {order.customer_name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {order.customer_email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {order.customer_phone}
                        </div>
                        <div>
                          <span className="font-medium">Payment:</span> {order.payment_method}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {formatCurrency(order.total_amount)}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span> {order.items?.length || 0} products
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
};

export default AdminOrders;
