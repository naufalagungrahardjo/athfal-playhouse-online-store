
import { User } from "@/types/auth";

export type AdminRole =
  | "super_admin"
  | "orders_manager"
  | "order_staff"
  | "content_manager"
  | "content_staff"
  | null;

export function getAdminRole(user: User | null): AdminRole {
  if (!user) return null;
  // Use the actual user.role string if it matches
  if (
    user.role === "super_admin" ||
    user.role === "orders_manager" ||
    user.role === "order_staff" ||
    user.role === "content_manager" ||
    user.role === "content_staff"
  ) {
    return user.role;
  }
  return null;
}
