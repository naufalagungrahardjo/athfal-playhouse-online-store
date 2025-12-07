
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
  canDelete?: boolean;
}

export function OrderListItem({
  order,
  getStatusColor,
  onViewDetails,
  onDelete,
  canDelete = true
}: OrderListItemProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-semibold break-words flex-1 min-w-0">Order ID: {order.id}</h3>
          <Badge className={`${getStatusColor(order.status)} shrink-0`}>
            {order.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
          <div className="break-words"><span className="font-medium">Customer:</span> {order.customer_name}</div>
          <div className="break-words"><span className="font-medium">Email:</span> {order.customer_email}</div>
          <div className="break-words"><span className="font-medium">Phone:</span> {order.customer_phone}</div>
          <div className="break-words"><span className="font-medium">Payment:</span> {order.payment_method}</div>
          <div><span className="font-medium">Total:</span> {formatCurrency(order.total_amount)}</div>
        </div>
        
        {order.items && order.items.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm text-gray-700 mb-2">Products Ordered:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {order.items.map((item) => (
                <li key={item.id} className="break-words">
                  • {item.product_name} <span className="font-medium">x{item.quantity}</span> - {formatCurrency(item.product_price * item.quantity)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Created: {new Date(order.created_at).toLocaleString()}
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(order)}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(order.id)}
              className="text-destructive hover:text-destructive w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
