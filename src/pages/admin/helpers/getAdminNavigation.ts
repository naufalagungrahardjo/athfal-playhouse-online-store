
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Settings, Menu, Image, HelpCircle, CreditCard, Users, Copy, MessageSquare
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
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Website Content', href: '/admin/website-copy', icon: Copy },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Categories', href: '/admin/categories', icon: Package },
  ];

  if (role === "super_admin") return navigation;
  if (role === "orders_manager") {
    return navigation.filter(item =>
      ["/admin", "/admin/products", "/admin/orders", "/admin/promo-codes", "/admin/payments"].includes(item.href)
    );
  }
  if (role === "order_staff") {
    return navigation.filter(item =>
      ["/admin/orders"].includes(item.href)
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
    ].includes(item.href));
  }
  if (role === "content_staff") {
    return navigation.filter(item =>
      ["/admin/blogs"].includes(item.href)
    );
  }
  return [];
}
