
import { User } from "@/types/auth";

export type AdminRole =
  | "super_admin"
  | "orders_manager"
  | "order_staff"
  | "content_manager"
  | "content_staff"
  | null;

// Replace with actual admin role fetching, here is a placeholder:
export function getAdminRole(user: User | null): AdminRole {
  if (!user) return null;
  if (user.email === "athfalplayhouse@gmail.com") return "super_admin";
  // TODO: Add actual fetching logic for roles based on email.
  return null;
}
