
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRole } from './helpers/getAdminRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderListByProductTab } from "@/components/admin/orders/OrderListByProductTab";

const AdminOrders = () => {
  const { orders, loading, fetchOrders, deleteOrder } = useOrders();
  const { user } = useAuth();
  const adminRole = getAdminRole(user);
  const canDelete = adminRole === 'super_admin' || adminRole === 'orders_manager';
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const getPaymentStatus = (order: any): 'paid_full' | 'paid_partial' | 'unpaid' => {
    const total = Number(order?.total_amount) || 0;
    const paid = Number(order?.amount_paid) || 0;
    if (total > 0 && paid >= total) return 'paid_full';
    if (paid > 0 && paid < total) return 'paid_partial';
    return 'unpaid';
  };
  const paymentStatusLabel = (s: string) =>
    s === 'paid_full' ? 'Paid Full' : s === 'paid_partial' ? 'Paid Partially' : 'Unpaid';

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
      case 'refund': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };
  const filteredOrders = useOrderFilters(orders, dateRange);

  const paymentFilteredOrders = useMemo(() => {
    if (paymentFilter === 'all') return filteredOrders;
    return filteredOrders.filter((o: any) => getPaymentStatus(o) === paymentFilter);
  }, [filteredOrders, paymentFilter]);

  // Search functionality
  const searchedOrders = useMemo(() => {
    if (!searchQuery.trim()) return paymentFilteredOrders;
    
    const query = searchQuery.toLowerCase();
    return paymentFilteredOrders.filter(order => {
      const payStatus = getPaymentStatus(order);
      const payLabel = paymentStatusLabel(payStatus);
      const fields: (string | number | null | undefined)[] = [
        order.id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.customer_address,
        order.payment_method,
        order.status,
        order.notes,
        order.promo_code,
        order.child_name,
        order.child_gender,
        order.child_age,
        order.guardian_status,
        order.total_amount,
        order.amount_paid,
        payStatus,
        payLabel,
        new Date(order.created_at).toLocaleDateString(),
      ];
      if (fields.some(v => v != null && String(v).toLowerCase().includes(query))) return true;

      if (order.items?.some((item: any) =>
        [item.product_name, item.session_name, item.installment_plan_name]
          .some((v: any) => v && String(v).toLowerCase().includes(query))
      )) return true;

      return false;
    });
  }, [paymentFilteredOrders, searchQuery]);

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
      <Tabs defaultValue="management" className="w-full">
        <TabsList>
          <TabsTrigger value="management">Order Management</TabsTrigger>
          <TabsTrigger value="by-product">Order List</TabsTrigger>
        </TabsList>
        <TabsContent value="management" className="space-y-6 mt-4">
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
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by Order ID, Customer, Payment Status (Paid Full / Paid Partially / Unpaid), Product, Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid_full">Paid Full</SelectItem>
            <SelectItem value="paid_partial">Paid Partially</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <OrderListSection
        filteredOrders={searchedOrders}
        getStatusColor={getStatusColor}
        handleViewDetails={handleViewDetails}
        handleDeleteOrder={handleDeleteOrder}
        canDelete={canDelete}
      />
        </TabsContent>
        <TabsContent value="by-product" className="mt-4">
          <OrderListByProductTab orders={orders} onViewDetails={handleViewDetails} />
        </TabsContent>
      </Tabs>
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
