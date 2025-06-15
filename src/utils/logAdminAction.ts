
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";

// action: e.g., "Added admin", "Updated admin", "Deleted admin"
export async function logAdminAction({
  user,
  action,
}: {
  user: User | null;
  action: string;
}) {
  if (!user || !user.email || !user.role) return;

  await supabase.from("admin_logs").insert([
    {
      email: user.email,
      role: user.role,
      action,
    },
  ]);
}
