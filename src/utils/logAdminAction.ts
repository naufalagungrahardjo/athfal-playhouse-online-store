
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";
import type { Enums } from "@/integrations/supabase/types";

// Roles allowed in admin_logs (matches public enum admin_role)
type AdminRole = Enums<"admin_role">;
const ADMIN_ROLES: Readonly<AdminRole[]> = [
  "super_admin",
  "orders_manager",
  "order_staff",
  "content_manager",
  "content_staff",
] as const;

// action: e.g., "Added admin", "Updated admin", "Deleted admin"
export async function logAdminAction({
  user,
  action,
}: {
  user: User | null;
  action: string;
}) {
  if (!user || !user.email) return;
  const role = user.role as AdminRole;
  if (!ADMIN_ROLES.includes(role)) return;

  await supabase.from("admin_logs").insert([
    {
      email: user.email,
      role,
      action,
    },
  ]);
}
