
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Settings, Image, HelpCircle, CreditCard, Users, Copy, MessageSquare, ListChecks, BarChart3, GraduationCap, ClipboardList, BookOpen
} from 'lucide-react';

export type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export function getAdminNavigation(role: string | null): NavigationGroup[] {
  const allGroups: NavigationGroup[] = [
    {
      label: 'Business',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Promo Codes', href: '/admin/promo-codes', icon: CreditCard },
      ],
    },
    {
      label: 'Admin (Super Admin Only)',
      items: [
        { name: 'Categories', href: '/admin/categories', icon: Package },
        { name: 'Admin Accounts', href: '/admin/accounts', icon: Users },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Website Content', href: '/admin/website-copy', icon: Copy },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Logs', href: '/admin/logs', icon: ListChecks },
      ],
    },
    {
      label: 'Class',
      items: [
        { name: 'All Teachers', href: '/admin/all-teachers', icon: GraduationCap },
        { name: 'Students', href: '/admin/students', icon: BookOpen },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { name: 'Blogs', href: '/admin/blogs', icon: FileText },
        { name: 'Banners', href: '/admin/banners', icon: Image },
        { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
        { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
      ],
    },
  ];

  if (role === "super_admin") return allGroups;

  // For other roles, filter items within groups and remove empty groups
  const allAllowed: Record<string, string[]> = {
    orders_manager: ["/admin", "/admin/products", "/admin/orders", "/admin/analytics", "/admin/promo-codes"],
    order_staff: ["/admin/orders"],
    content_manager: ["/admin/blogs", "/admin/banners", "/admin/website-copy", "/admin/categories", "/admin/faq", "/admin/testimonials"],
    content_staff: ["/admin/blogs"],
    teacher: ["/admin/teacher", "/admin/students"],
  };

  const allowed = allAllowed[role ?? ""] ?? [];

  if (role === "teacher") {
    return [{
      label: 'Class',
      items: [
        { name: 'Teacher', href: '/admin/teacher', icon: ClipboardList },
        { name: 'Students', href: '/admin/students', icon: BookOpen },
      ],
    }];
  }

  return allGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => allowed.includes(item.href)),
    }))
    .filter(group => group.items.length > 0);
}
