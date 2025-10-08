
import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { ClickableStatsCard } from '@/components/admin/ClickableStatsCard';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  PackageCheck,
  Truck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const AdminDashboard = () => {
  const { stats, loading } = useDashboard();
  const [selectedView, setSelectedView] = useState<string | null>(null);

  const handleCloseDialog = () => {
    setSelectedView(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your admin dashboard. Click on any card to see detailed information.
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ClickableStatsCard
          title="Revenue (Before Tax)"
          value={formatCurrency(stats.revenueBeforeTax)}
          icon={DollarSign}
          onClick={() => setSelectedView('orders')}
        />
        <ClickableStatsCard
          title="Revenue (After Tax)"
          value={formatCurrency(stats.revenueAfterTax)}
          icon={TrendingUp}
          onClick={() => setSelectedView('orders')}
        />
        <ClickableStatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
        />
        <ClickableStatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
        />
      </div>

      {/* Order Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ClickableStatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          onClick={() => setSelectedView('orders')}
        />
        <ClickableStatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Clock}
          onClick={() => setSelectedView('orders')}
          className="border-yellow-200 bg-yellow-50"
        />
        <ClickableStatsCard
          title="Processing Orders"
          value={stats.processingOrders}
          icon={PackageCheck}
          onClick={() => setSelectedView('orders')}
          className="border-blue-200 bg-blue-50"
        />
        <ClickableStatsCard
          title="Shipped Orders"
          value={stats.shippedOrders}
          icon={Truck}
          onClick={() => setSelectedView('orders')}
          className="border-purple-200 bg-purple-50"
        />
        <ClickableStatsCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={CheckCircle}
          onClick={() => setSelectedView('orders')}
          className="border-green-200 bg-green-50"
        />
        <ClickableStatsCard
          title="Cancelled Orders"
          value={stats.cancelledOrders}
          icon={XCircle}
          onClick={() => setSelectedView('orders')}
          className="border-red-200 bg-red-50"
        />
      </div>

      {/* Order Management Dialog */}
      <Dialog open={selectedView === 'orders'} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Management</DialogTitle>
          </DialogHeader>
          <OrderManagement onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
