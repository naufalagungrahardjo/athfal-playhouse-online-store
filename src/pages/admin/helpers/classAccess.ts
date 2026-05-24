import { User } from "@/types/auth";
import { getAdminRole } from "./getAdminRole";

// Emails granted full super-admin-equivalent access within the Class menu
// (All Teachers, Students, Check-In/Out, Inbox). They DO NOT get access to
// Business / Admin / Marketing menus.
export const CLASS_SUPER_EMAILS = [
  "ramadhannisa.fadhilah@gmail.com",
];

export function hasClassSuperAccess(user: User | null): boolean {
  if (!user) return false;
  if (getAdminRole(user) === "super_admin") return true;
  return !!user.email && CLASS_SUPER_EMAILS.includes(user.email.toLowerCase());
}

export function isClassSuperEmail(email?: string | null): boolean {
  if (!email) return false;
  return CLASS_SUPER_EMAILS.includes(email.toLowerCase());
}