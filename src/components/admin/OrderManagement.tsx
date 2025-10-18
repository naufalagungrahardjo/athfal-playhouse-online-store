
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';

interface OrderManagementProps {
  onClose?: () => void;
  onOrderUpdate?: () => void;
}

export const OrderManagement = ({ onClose, onOrderUpdate }: OrderManagementProps) => {
  const { orders, loading, updateOrderStatus } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status.toLowerCase() === selectedStatus
  );

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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    onOrderUpdate?.();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Order Management</h2>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by Order ID, Product Name, or Date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {searchedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          searchedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order ID: {order.id}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                      <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                      <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                      {order.customer_address && (
                        <p><span className="font-medium">Address:</span> {order.customer_address}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Payment:</span> {order.payment_method}</p>
                      <p><span className="font-medium">Subtotal:</span> {formatCurrency(order.subtotal)}</p>
                      <p><span className="font-medium">Tax:</span> {formatCurrency(order.tax_amount)}</p>
                      <p><span className="font-medium text-lg">Total:</span> <span className="text-lg font-bold text-athfal-pink">{formatCurrency(order.total_amount)}</span></p>
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.product_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm bg-gray-50 p-2 rounded">{order.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <Select
                    value={order.status}
                    onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
