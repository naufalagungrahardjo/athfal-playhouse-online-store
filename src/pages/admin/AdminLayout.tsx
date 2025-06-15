
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings, 
  Menu,
  Image,
  HelpCircle,
  CreditCard,
  Users,
  Copy,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect non-admin users to home page
  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Banners', href: '/admin/banners', icon: Image },
    { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
    { name: 'Content', href: '/admin/content', icon: Copy },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
    { name: 'Promo Codes', href: '/admin/promo-codes', icon: CreditCard },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Website Copy', href: '/admin/website-copy', icon: Copy },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Categories', href: '/admin/categories', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4">
              <Link to="/admin" className="flex items-center text-lg font-semibold">
                Athfal Admin
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-6 py-3 text-sm font-medium hover:bg-gray-200",
                        location.pathname === item.href ? 'bg-gray-200' : 'bg-transparent'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200">
        <div className="px-6 py-4">
          <Link to="/admin" className="flex items-center text-lg font-semibold">
            Athfal Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-6 py-3 text-sm font-medium hover:bg-gray-200",
                    location.pathname === item.href ? 'bg-gray-200' : 'bg-transparent'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
