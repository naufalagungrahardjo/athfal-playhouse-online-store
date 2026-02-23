
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Settings, Menu, Image, HelpCircle, CreditCard, Users, Copy, MessageSquare, ListChecks
} from 'lucide-react';

export type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

export function getAdminNavigation(role: string | null) : NavigationItem[] {
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Admin Accounts', href: '/admin/accounts', icon: Users },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Banners', href: '/admin/banners', icon: Image },
    { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
    { name: 'Promo Codes', href: '/admin/promo-codes', icon: CreditCard },
    { name: 'Website Content', href: '/admin/website-copy', icon: Copy },
    { name: 'Logs', href: '/admin/logs', icon: ListChecks }, // Add Admin Logs page
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Categories', href: '/admin/categories', icon: Package },
  ];

  if (role === "super_admin") return navigation;
  if (role === "orders_manager") {
    return navigation.filter(item =>
      ["/admin", "/admin/products", "/admin/orders", "/admin/promo-codes", "/admin/logs"].includes(item.href)
    );
  }
  if (role === "order_staff") {
    return navigation.filter(item =>
      ["/admin/orders", "/admin/logs"].includes(item.href)
    );
  }
  if (role === "content_manager") {
    return navigation.filter(item => [
      "/admin/blogs",
      "/admin/banners",
      "/admin/website-copy",
      "/admin/categories",
      "/admin/faq",
      "/admin/testimonials",
      "/admin/logs"
    ].includes(item.href));
  }
  if (role === "content_staff") {
    return navigation.filter(item =>
      ["/admin/blogs", "/admin/logs"].includes(item.href)
    );
  }
  return [];
}
