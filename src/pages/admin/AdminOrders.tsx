
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Calendar
} from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  notes?: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<{ [key: string]: OrderItem[] }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  // Fetch orders from database
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Fetch order items for each order
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) throw itemsError;

      // Group items by order_id
      const itemsByOrder: { [key: string]: OrderItem[] } = {};
      itemsData?.forEach(item => {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item);
      });

      setOrderItems(itemsByOrder);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: "Failed to load orders from database",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle view order details
  const handleViewOrder = (order: Order) => {
    setCurrentOrder(order);
    setNewStatus(order.status);
    setShowDetailsModal(true);
  };

  // Handle delete order
  const handleDeleteOrder = (order: Order) => {
    setCurrentOrder(order);
    setShowDeleteModal(true);
  };

  // Handle update order status
  const handleUpdateStatus = async () => {
    if (!currentOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentOrder.id);

      if (error) throw error;

      toast({
        title: "Order status updated",
        description: `Order status has been updated to ${newStatus}`,
      });

      // Refresh orders list
      await fetchOrders();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Error updating order",
        description: "Failed to update order status",
      });
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!currentOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', currentOrder.id);

      if (error) throw error;

      toast({
        title: "Order deleted",
        description: `Order has been deleted successfully`,
        variant: "destructive",
      });

      // Refresh orders list
      await fetchOrders();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        variant: "destructive",
        title: "Error deleting order",
        description: "Failed to delete order from database",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Orders</h2>
          <p className="text-gray-500 mt-1">Manage customer orders and track their status</p>
        </div>
      </div>

      {/* Order filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by customer name, email, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by status">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="px-4 py-3 font-medium text-gray-800">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-gray-600">{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{order.payment_method}</td>
                      <td className="px-4 py-3 text-gray-600 text-right font-medium">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Status
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteOrder(order)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {showDetailsModal && currentOrder && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Order ID: {currentOrder.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span> {currentOrder.customer_name}
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span> {currentOrder.customer_email}
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span> {currentOrder.customer_phone}
                  </div>
                  <div>
                    <span className="text-gray-500">Payment:</span> {currentOrder.payment_method}
                  </div>
                  {currentOrder.customer_address && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Address:</span> {currentOrder.customer_address}
                    </div>
                  )}
                  {currentOrder.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Notes:</span> {currentOrder.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {orderItems[currentOrder.id]?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.product_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(currentOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(currentOrder.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(currentOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button 
                onClick={handleUpdateStatus}
                className="bg-athfal-pink hover:bg-athfal-pink/80 text-white"
                disabled={newStatus === currentOrder.status}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentOrder && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this order? This action cannot be undone.
                <br />
                <strong>Order ID:</strong> {currentOrder.id}
                <br />
                <strong>Customer:</strong> {currentOrder.customer_name}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminOrders;
