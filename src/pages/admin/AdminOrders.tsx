
import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderDetailsDialog } from '@/components/admin/OrderDetailsDialog';
import { DateRange } from "react-day-picker";
import { OrderStatistics } from "@/components/admin/OrderStatistics";
import { OrderFilterToolbar } from "@/components/admin/OrderFilterToolbar";
import { useOrderFilters } from "@/components/admin/orders/useOrderFilters";
import { exportOrdersToCSV } from "@/components/admin/orders/orderExportUtils";
import { OrderListSection } from "@/components/admin/orders/OrderListSection";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRole } from './helpers/getAdminRole';

const AdminOrders = () => {
  const { orders, loading, fetchOrders, deleteOrder } = useOrders();
  const { user } = useAuth();
  const adminRole = getAdminRole(user);
  const canDelete = adminRole === 'super_admin' || adminRole === 'orders_manager';
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

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
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };
  const filteredOrders = useOrderFilters(orders, dateRange);

  // Search functionality
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return filteredOrders;
    
    const query = searchQuery.toLowerCase();
    return filteredOrders.filter(order => {
      // Search by order ID
      if (order.id.toLowerCase().includes(query)) return true;
      
      // Search by product name in order items
      if (order.items?.some((item: any) => item.product_name.toLowerCase().includes(query))) return true;
      
      // Search by date
      const orderDate = new Date(order.created_at).toLocaleDateString();
      if (orderDate.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [filteredOrders, searchQuery]);

  const onExport = () => exportOrdersToCSV(searchedOrders, dateRange);

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
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by Order ID, Product Name, or Date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <OrderListSection
        filteredOrders={searchedOrders}
        getStatusColor={getStatusColor}
        handleViewDetails={handleViewDetails}
        handleDeleteOrder={handleDeleteOrder}
        canDelete={canDelete}
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
