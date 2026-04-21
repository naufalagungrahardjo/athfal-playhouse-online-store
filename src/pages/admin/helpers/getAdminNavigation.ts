
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Settings, Image, HelpCircle, CreditCard, Users, Copy, MessageSquare, ListChecks, BarChart3, GraduationCap, ClipboardList, BookOpen, Wallet, FileCheck
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

export function getAdminNavigation(role: string | null, allowedMenus?: string[] | null): NavigationGroup[] {
  const allGroups: NavigationGroup[] = [
    {
      label: 'Business',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Promo Codes', href: '/admin/promo-codes', icon: CreditCard },
        { name: 'Expense', href: '/admin/expense', icon: Wallet },
        { name: 'Other Income', href: '/admin/other-income', icon: Wallet },
      ],
    },
    {
      label: 'Admin (Super Admin Only)',
      items: [
        { name: 'Categories', href: '/admin/categories', icon: Package },
        { name: 'Admin Accounts', href: '/admin/accounts', icon: Users },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Website Content', href: '/admin/website-copy', icon: Copy },
        { name: 'Checkout Terms', href: '/admin/checkout-terms', icon: FileCheck },
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

  // Super admin with no custom menu override gets everything
  if (role === "super_admin" && !allowedMenus) return allGroups;

  // If allowedMenus is explicitly set (by super admin), use that as final access
  if (allowedMenus && allowedMenus.length > 0) {
    // For teacher role, add teacher-specific item if allowed
    const teacherItems: NavigationItem[] = [];
    if (role === "teacher" && allowedMenus.includes("/admin/teacher")) {
      teacherItems.push({ name: 'Teacher', href: '/admin/teacher', icon: ClipboardList });
    }

    const filtered = allGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => allowedMenus.includes(item.href)),
      }))
      .filter(group => group.items.length > 0);

    // Add teacher-specific items if any
    if (teacherItems.length > 0) {
      const classGroup = filtered.find(g => g.label === 'Class');
      if (classGroup) {
        classGroup.items = [...teacherItems, ...classGroup.items];
      } else {
        filtered.push({ label: 'Class', items: teacherItems });
      }
    }

    return filtered;
  }

  // Default role-based access (no custom override)
  const allAllowed: Record<string, string[]> = {
    super_admin: [], // handled above
    orders_manager: ["/admin", "/admin/products", "/admin/orders", "/admin/analytics", "/admin/promo-codes", "/admin/expense", "/admin/other-income"],
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

/** Returns all possible menu items (for the edit dialog) */
export function getAllMenuItems(): { href: string; name: string }[] {
  return [
    { href: '/admin', name: 'Dashboard' },
    { href: '/admin/analytics', name: 'Analytics' },
    { href: '/admin/products', name: 'Products' },
    { href: '/admin/orders', name: 'Orders' },
    { href: '/admin/promo-codes', name: 'Promo Codes' },
    { href: '/admin/expense', name: 'Expense' },
    { href: '/admin/other-income', name: 'Other Income' },
    { href: '/admin/categories', name: 'Categories' },
    { href: '/admin/accounts', name: 'Admin Accounts' },
    { href: '/admin/users', name: 'Users' },
    { href: '/admin/website-copy', name: 'Website Content' },
    { href: '/admin/checkout-terms', name: 'Checkout Terms' },
    { href: '/admin/settings', name: 'Settings' },
    { href: '/admin/logs', name: 'Logs' },
    { href: '/admin/all-teachers', name: 'All Teachers' },
    { href: '/admin/students', name: 'Students' },
    { href: '/admin/teacher', name: 'Teacher (Personal)' },
    { href: '/admin/blogs', name: 'Blogs' },
    { href: '/admin/banners', name: 'Banners' },
    { href: '/admin/faq', name: 'FAQ' },
    { href: '/admin/testimonials', name: 'Testimonials' },
  ];
}
