
import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { DateRange } from "react-day-picker";
import { OrderStatistics } from "@/components/admin/OrderStatistics";
import { OrderFilterToolbar } from "@/components/admin/OrderFilterToolbar";
import { useOrderFilters } from "@/components/admin/orders/useOrderFilters";
import { exportOrdersToCSV } from "@/components/admin/orders/orderExportUtils";
import { OrderListSection } from "@/components/admin/orders/OrderListSection";

const AdminOrders = () => {
  const { orders, loading, fetchOrders, deleteOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleViewDetails = (order: any) => {
    if (!order || typeof order !== 'object') return;
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };
  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setIsDetailsOpen(false);
  };
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    await deleteOrder(orderId);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };
  const filteredOrders = useOrderFilters(orders, dateRange);

  const onExport = () => exportOrdersToCSV(filteredOrders, dateRange);

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
        onExport={onExport}
      />
      <OrderStatistics
        orders={orders}
        getStatusCount={getStatusCount}
      />
      <OrderListSection
        filteredOrders={filteredOrders}
        getStatusColor={getStatusColor}
        handleViewDetails={handleViewDetails}
        handleDeleteOrder={handleDeleteOrder}
      />
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
