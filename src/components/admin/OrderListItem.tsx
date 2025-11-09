
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

interface OrderListItemProps {
  order: Order;
  getStatusColor: (status: string) => string;
  onViewDetails: (order: Order) => void;
  onDelete: (id: string) => void;
}

export function OrderListItem({
  order,
  getStatusColor,
  onViewDetails,
  onDelete
}: OrderListItemProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <h3 className="font-semibold flex-1 min-w-0 truncate">Order ID: {order.id}</h3>
            <Badge className={`${getStatusColor(order.status)} shrink-0`}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 min-w-0">
            <div className="min-w-0 truncate"><span className="font-medium">Customer:</span> {order.customer_name}</div>
            <div className="min-w-0 truncate"><span className="font-medium">Email:</span> {order.customer_email}</div>
            <div className="min-w-0 truncate"><span className="font-medium">Phone:</span> {order.customer_phone}</div>
            <div className="min-w-0 truncate"><span className="font-medium">Payment:</span> {order.payment_method}</div>
            <div><span className="font-medium">Total:</span> {formatCurrency(order.total_amount)}</div>
          </div>
          {order.items && order.items.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm text-gray-700 mb-2">Products Ordered:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {order.items.map((item) => (
                  <li key={item.id}>
                    • {item.product_name} <span className="font-medium">x{item.quantity}</span> - {formatCurrency(item.product_price * item.quantity)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Created: {new Date(order.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(order.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
