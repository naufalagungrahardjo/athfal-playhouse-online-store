
import { useState } from "react";
import { useAdminAccounts, AdminRole } from "@/hooks/useAdminAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Bell, BellOff, Pencil } from "lucide-react";
import { getAllMenuItems } from "./helpers/getAdminNavigation";

const ROLES: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "orders_manager", label: "Orders Manager" },
  { value: "order_staff", label: "Order Staff" },
  { value: "content_manager", label: "Content Manager" },
  { value: "content_staff", label: "Content Staff" },
  { value: "teacher", label: "Teacher" }
];

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access to all features including user management, admin account management, and system settings.",
  orders_manager: "Full access to order management, products, and customer data. Can create, update, and delete orders and products.",
  order_staff: "Can view and update order status only. Cannot modify order details, pricing, or customer information.",
  content_manager: "Full access to content management including blogs, FAQs, banners, testimonials, and website copy.",
  content_staff: "Can create and edit content (blogs, FAQs, banners) but with limited deletion permissions.",
  teacher: "Can access the Teacher menu to record attendance, submit leave requests, and view attendance history."
};

// Default menus per role (for reference when editing)
const DEFAULT_MENUS: Record<string, string[]> = {
  super_admin: getAllMenuItems().map(m => m.href),
  orders_manager: ["/admin", "/admin/products", "/admin/orders", "/admin/analytics", "/admin/promo-codes", "/admin/expense", "/admin/other-income"],
  order_staff: ["/admin/orders"],
  content_manager: ["/admin/blogs", "/admin/banners", "/admin/website-copy", "/admin/categories", "/admin/faq", "/admin/testimonials"],
  content_staff: ["/admin/blogs"],
  teacher: ["/admin/teacher", "/admin/students"],
};

const AdminAccounts = () => {
  const { accounts, loading, addOrUpdateAccount, deleteAccount, toggleOrderAlerts, updateAllowedMenus } = useAdminAccounts();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("content_staff");

  // Edit menu dialog state
  const [editingAccount, setEditingAccount] = useState<typeof accounts[0] | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  const allMenuItems = getAllMenuItems();

  const openEditDialog = (acc: typeof accounts[0]) => {
    setEditingAccount(acc);
    // If custom menus exist, use them; otherwise use defaults for the role
    const current = acc.allowed_menus ?? DEFAULT_MENUS[acc.role] ?? [];
    setSelectedMenus([...current]);
  };

  const toggleMenu = (href: string) => {
    setSelectedMenus(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const saveMenus = async () => {
    if (!editingAccount) return;
    await updateAllowedMenus(editingAccount.email, selectedMenus.length > 0 ? selectedMenus : null);
    setEditingAccount(null);
  };

  const resetToDefault = () => {
    if (!editingAccount) return;
    const defaults = DEFAULT_MENUS[editingAccount.role] ?? [];
    setSelectedMenus([...defaults]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Role Management</CardTitle>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Role Capabilities:</p>
            {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, description]) => {
              const roleLabel = ROLES.find(r => r.value === roleKey)?.label || roleKey;
              return (
                <div key={roleKey} className="pl-4 border-l-2 border-primary/20">
                  <span className="font-medium text-foreground">{roleLabel}:</span> {description}
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 md:flex-row"
            onSubmit={async e => {
              e.preventDefault();
              if (!email || !role) return;
              await addOrUpdateAccount(email.trim().toLowerCase(), role);
              setEmail("");
              setRole("content_staff");
            }}
          >
            <Input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Select value={role} onValueChange={v => setRole(v as AdminRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="bg-athfal-pink text-white">Assign</Button>
          </form>
          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Order Alerts</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Custom Menu</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.email} className="border-b last:border-0">
                        <td className="px-4 py-3 text-sm break-all">{acc.email}</td>
                        <td className="px-4 py-3 text-sm capitalize">{acc.role.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {acc.order_alerts ? (
                              <Bell className="h-4 w-4 text-green-600" />
                            ) : (
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Switch
                              checked={acc.order_alerts}
                              onCheckedChange={(checked) => toggleOrderAlerts(acc.email, checked)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {acc.allowed_menus ? (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Custom ({acc.allowed_menus.length})
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Default</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(acc)}
                              title="Edit menu access"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={acc.role === "super_admin"}
                              onClick={() => deleteAccount(acc.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Menu Access Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Access</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editingAccount?.email} ({editingAccount?.role.replace(/_/g, " ")})
            </p>
          </DialogHeader>
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Accessible Menus</p>
              <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs">
                Reset to Default
              </Button>
            </div>
            {allMenuItems.map(item => (
              <label
                key={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selectedMenus.includes(item.href)}
                  onCheckedChange={() => toggleMenu(item.href)}
                />
                <span className="text-sm">{item.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{item.href}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
            <Button onClick={saveMenus} className="bg-athfal-pink text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AdminAccounts;
