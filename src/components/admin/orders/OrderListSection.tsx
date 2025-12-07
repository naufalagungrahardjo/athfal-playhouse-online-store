
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderListItem } from "@/components/admin/OrderListItem";

interface OrderListSectionProps {
  filteredOrders: any[];
  getStatusColor: (status: string) => string;
  handleViewDetails: (o: any) => void;
  handleDeleteOrder: (id: string) => void;
  canDelete?: boolean;
}

export const OrderListSection = ({
  filteredOrders,
  getStatusColor,
  handleViewDetails,
  handleDeleteOrder,
  canDelete = true,
}: OrderListSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Orders</CardTitle>
    </CardHeader>
    <CardContent>
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
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
                canDelete={canDelete}
              />
            ) : null
          )}
        </div>
      )}
    </CardContent>
  </Card>
);
