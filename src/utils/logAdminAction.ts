
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";

// Roles allowed in admin_logs
const ADMIN_ROLES = [
  "super_admin",
  "orders_manager",
  "order_staff",
  "content_manager",
  "content_staff",
] as const;
type AdminRole = typeof ADMIN_ROLES[number];

// action: e.g., "Added admin", "Updated admin", "Deleted admin"
export async function logAdminAction({
  user,
  action,
}: {
  user: User | null;
  action: string;
}) {
  if (
    !user ||
    !user.email ||
    !user.role ||
    !ADMIN_ROLES.includes(user.role as AdminRole)
  )
    return;

  await supabase.from("admin_logs").insert([
    {
      email: user.email,
      role: user.role as AdminRole,
      action,
    },
  ]);
}
