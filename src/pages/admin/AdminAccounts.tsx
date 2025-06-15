
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

const AdminAccounts = () => {
  const { accounts, loading, addOrUpdateAccount, deleteAccount } = useAdminAccounts();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("content_staff");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Role Management</CardTitle>
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
          <div className="mt-6">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <table className="min-w-full table-auto border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.email} className="border-t">
                      <td className="px-4 py-2">{acc.email}</td>
                      <td className="px-4 py-2 capitalize">{acc.role.replace("_", " ")}</td>
                      <td className="px-4 py-2">
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default AdminAccounts;
