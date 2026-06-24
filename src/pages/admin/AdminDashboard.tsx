
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { useDashboardDetails } from '@/hooks/useDashboardDetails';
import { supabase } from '@/integrations/supabase/client';
import { ClickableStatsCard } from '@/components/admin/ClickableStatsCard';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { FundBalanceTable } from '@/components/admin/FundBalanceTable';
import {
  SalesDetailTable,
  OtherIncomeDetailTable,
  ReceivableDetailTable,
  MoneyFlowSummary,
} from '@/components/admin/DashboardDetailTables';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  Truck,
  BadgePercent,
  Wallet,
  Coins,
  CalendarIcon,
  Banknote,
  PiggyBank,
  Target,
  HandCoins,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRole } from './helpers/getAdminRole';

const AdminDashboard = () => {
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { stats, loading, fetchDashboardStats } = useDashboard(dateRange);
  const { summary } = useFinancialSummary(dateRange);
  const { details } = useDashboardDetails(dateRange);
  const { user } = useAuth();
  const adminRole = getAdminRole(user);

  // Custom menu grants can give non-default roles (e.g. teachers) explicit
  // dashboard access. Load them so we don't wrongly redirect those users away.
  const [allowedMenus, setAllowedMenus] = useState<string[] | null>(null);
  const [menusLoaded, setMenusLoaded] = useState(false);
  useEffect(() => {
    const loadMenus = async () => {
      if (!user?.email) { setMenusLoaded(true); return; }
      const { data } = await supabase
        .from('admin_accounts')
        .select('allowed_menus')
        .eq('email', user.email)
        .maybeSingle();
      setAllowedMenus(data?.allowed_menus ?? null);
      setMenusLoaded(true);
    };
    loadMenus();
  }, [user?.email]);

  const hasDashboardAccess = !!allowedMenus?.includes('/admin/dashboard');

  if (!menusLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  // Content manager & content staff should go directly to blogs
  if ((adminRole === 'content_manager' || adminRole === 'content_staff') && !hasDashboardAccess) {
    return <Navigate to="/admin/blogs" replace />;
  }

  // Teacher should go directly to the Check-In/Check-Out page
  if (adminRole === 'teacher' && !hasDashboardAccess) {
    return <Navigate to="/admin/check-in-out" replace />;
  }

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

  const showRevenue = adminRole !== 'order_staff';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard. Click on any card to see detailed information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Lifetime</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Financial Summary (Profit & Loss) */}
      {showRevenue && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ClickableStatsCard
            title="Sales Revenue"
            value={formatCurrency(summary.salesRevenue)}
            icon={DollarSign}
            onClick={() => setSelectedView('salesDetail')}
          />
          <ClickableStatsCard
            title="Other Income"
            value={formatCurrency(summary.otherIncome)}
            icon={HandCoins}
            onClick={() => setSelectedView('otherIncomeDetail')}
          />
          <ClickableStatsCard
            title="Total Revenue (Paid)"
            value={formatCurrency(summary.salesRevenue + summary.otherIncome)}
            icon={Wallet}
            className="border-green-200 bg-green-50"
          />
          <ClickableStatsCard
            title="Outstanding Receivables"
            value={formatCurrency(stats.outstandingReceivables)}
            icon={DollarSign}
            onClick={() => setSelectedView('receivablesDetail')}
            className="border-red-200 bg-red-50"
          />
          <ClickableStatsCard
            title="Total Revenue (Paid + Receivable)"
            value={formatCurrency(summary.salesRevenue + summary.otherIncome + stats.outstandingReceivables)}
            icon={Coins}
            className="border-blue-200 bg-blue-50"
          />
          <ClickableStatsCard
            title="Capital Inflow"
            value={formatCurrency(summary.capitalInflow)}
            icon={PiggyBank}
          />
          <ClickableStatsCard
            title="Total Expenses"
            value={formatCurrency(summary.totalExpenses)}
            icon={Receipt}
            className="border-red-200 bg-red-50"
          />
          <ClickableStatsCard
            title="Net Income"
            value={formatCurrency(summary.netIncome)}
            icon={TrendingUp}
            className={summary.netIncome >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
          />
          <ClickableStatsCard
            title="Target to BEP"
            value={formatCurrency(summary.targetToBEP)}
            icon={Target}
            onClick={() => setSelectedView('moneyFlow')}
            className={summary.targetToBEP >= 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}
          />
          <ClickableStatsCard
            title="Bank Balance"
            value={formatCurrency(summary.bankBalance)}
            icon={Banknote}
            onClick={() => setSelectedView('fundBalance')}
            className="border-blue-200 bg-blue-50"
          />
        </div>
      )}

      {/* Revenue & Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {showRevenue && (
          <>
            <ClickableStatsCard
              title="Discount Given"
              value={formatCurrency(stats.totalDiscount)}
              icon={BadgePercent}
              onClick={() => setSelectedView('orders')}
              className="border-orange-200 bg-orange-50"
            />
          </>
        )}
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
          <OrderManagement onClose={handleCloseDialog} onOrderUpdate={fetchDashboardStats} />
        </DialogContent>
      </Dialog>

      {/* Fund Balance Dialog */}
      <Dialog open={selectedView === 'fundBalance'} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>💰 Fund Balance by Source / Bank</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Where your money sits: inflows from sales, other income, capital, and fund transfers vs outflows from expenses per fund source.
          </p>
          <FundBalanceTable data={summary.fundBalance} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
