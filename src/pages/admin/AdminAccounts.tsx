
import { useState } from "react";
import { useAdminAccounts, AdminRole } from "@/hooks/useAdminAccounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const ROLES: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "orders_manager", label: "Orders Manager" },
  { value: "order_staff", label: "Order Staff" },
  { value: "content_manager", label: "Content Manager" },
  { value: "content_staff", label: "Content Staff" }
];

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access to all features including user management, admin account management, and system settings.",
  orders_manager: "Full access to order management, products, and customer data. Can create, update, and delete orders and products.",
  order_staff: "Can view and update order status only. Cannot modify order details, pricing, or customer information.",
  content_manager: "Full access to content management including blogs, FAQs, banners, testimonials, and website copy.",
  content_staff: "Can create and edit content (blogs, FAQs, banners) but with limited deletion permissions."
};

const AdminAccounts = () => {
  const { accounts, loading, addOrUpdateAccount, deleteAccount } = useAdminAccounts();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("content_staff");

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
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.email} className="border-b last:border-0">
                        <td className="px-4 py-3 text-sm break-all">{acc.email}</td>
                        <td className="px-4 py-3 text-sm capitalize">{acc.role.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={acc.role === "super_admin"}
                            onClick={() => deleteAccount(acc.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};
export default AdminAccounts;
