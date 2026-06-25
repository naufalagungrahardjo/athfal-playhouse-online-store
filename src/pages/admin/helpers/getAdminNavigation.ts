
import {
  LayoutDashboard, Package, ShoppingCart, FileText, Settings, Image, HelpCircle, CreditCard, Users, Copy, MessageSquare, ListChecks, BarChart3, GraduationCap, ClipboardList, BookOpen, Wallet, FileCheck, Camera, Inbox, FolderOpen
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

import { isClassSuperEmail } from './classAccess';

export function getAdminNavigation(role: string | null, allowedMenus?: string[] | null, email?: string | null): NavigationGroup[] {
  const allGroups: NavigationGroup[] = [
    {
      label: 'Business',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
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
        { name: 'Check-In/Out', href: '/admin/check-in-out', icon: Camera },
        { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
        { name: 'Documents', href: '/admin/documents', icon: FolderOpen },
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
    // Enforce hard role restrictions even if super admin granted extra menus
    let effectiveAllowed = allowedMenus;
    if (role === "order_staff" || role === "content_staff") {
      effectiveAllowed = allowedMenus.filter(m => m !== "/admin/inbox");
    }
    // For teacher role, add teacher-specific item if allowed
    const teacherItems: NavigationItem[] = [];
    if (role === "teacher" && effectiveAllowed.includes("/admin/teacher")) {
      teacherItems.push({ name: 'Teacher', href: '/admin/teacher', icon: ClipboardList });
    }
    if (role === "teacher" && effectiveAllowed.includes("/admin/check-in-out")) {
      teacherItems.push({ name: 'Check-In/Out', href: '/admin/check-in-out', icon: Camera });
    }

    const filtered = allGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => effectiveAllowed.includes(item.href)),
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

  // Class-super email: teachers granted full Class menu access (no custom override set)
  if (role === "teacher" && isClassSuperEmail(email)) {
    return [{
      label: 'Class',
      items: [
        { name: 'All Teachers', href: '/admin/all-teachers', icon: GraduationCap },
        { name: 'Teacher', href: '/admin/teacher', icon: ClipboardList },
        { name: 'Students', href: '/admin/students', icon: BookOpen },
        { name: 'Check-In/Out', href: '/admin/check-in-out', icon: Camera },
        { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
      ],
    }];
  }

  // Default role-based access (no custom override)
  const allAllowed: Record<string, string[]> = {
    super_admin: [], // handled above
    orders_manager: ["/admin/dashboard", "/admin/products", "/admin/orders", "/admin/analytics", "/admin/promo-codes", "/admin/expense", "/admin/other-income", "/admin/inbox"],
    order_staff: ["/admin/orders"],
    content_manager: ["/admin/blogs", "/admin/banners", "/admin/faq", "/admin/testimonials", "/admin/inbox"],
    content_staff: ["/admin/blogs"],
    teacher: ["/admin/teacher", "/admin/students", "/admin/check-in-out", "/admin/inbox"],
  };

  const allowed = allAllowed[role ?? ""] ?? [];

  if (role === "teacher") {
    return [{
      label: 'Class',
      items: [
        { name: 'Teacher', href: '/admin/teacher', icon: ClipboardList },
        { name: 'Students', href: '/admin/students', icon: BookOpen },
        { name: 'Check-In/Out', href: '/admin/check-in-out', icon: Camera },
        { name: 'Inbox', href: '/admin/inbox', icon: Inbox },
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
    { href: '/admin/dashboard', name: 'Dashboard' },
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
    { href: '/admin/check-in-out', name: 'Check-In/Out' },
    { href: '/admin/inbox', name: 'Inbox' },
    { href: '/admin/documents', name: 'Documents' },
    { href: '/admin/blogs', name: 'Blogs' },
    { href: '/admin/banners', name: 'Banners' },
    { href: '/admin/faq', name: 'FAQ' },
    { href: '/admin/testimonials', name: 'Testimonials' },
  ];
}
