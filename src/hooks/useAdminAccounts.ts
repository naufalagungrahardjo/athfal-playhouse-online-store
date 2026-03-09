
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/utils/logAdminAction";

export type AdminRole = "super_admin" | "orders_manager" | "order_staff" | "content_manager" | "content_staff" | "teacher";
export interface AdminAccount {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  order_alerts: boolean;
  allowed_menus: string[] | null;
}

export function useAdminAccounts() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user to log actions

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("admin_accounts").select("*").order("created_at", { ascending: true });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch admin accounts" });
      setLoading(false);
      return;
    }
    setAccounts(data || []);
    setLoading(false);
  };

  const addOrUpdateAccount = async (email: string, role: AdminRole) => {
    const { error } = await supabase.from("admin_accounts").upsert([{ email, role }], { onConflict: "email" });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update admin" });
      return false;
    }
    toast({ title: "Success", description: "Admin updated" });
    await logAdminAction({
      user,
      action: `Added or updated admin: ${email} (role: ${role})`,
    });
    fetchAccounts();
    return true;
  };

  const deleteAccount = async (email: string) => {
    const { error } = await supabase.from("admin_accounts").delete().eq("email", email);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete admin" });
      return false;
    }
    toast({ title: "Success", description: "Admin deleted" });
    await logAdminAction({
      user,
      action: `Deleted admin: ${email}`,
    });
    fetchAccounts();
    return true;
  };

  const toggleOrderAlerts = async (email: string, enabled: boolean) => {
    const { error } = await supabase
      .from("admin_accounts")
      .update({ order_alerts: enabled })
      .eq("email", email);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update alert setting" });
      return false;
    }
    toast({ title: "Updated", description: `Order alerts ${enabled ? "enabled" : "disabled"} for ${email}` });
    fetchAccounts();
    return true;
  };

  const updateAllowedMenus = async (email: string, menus: string[] | null) => {
    const { error } = await supabase
      .from("admin_accounts")
      .update({ allowed_menus: menus })
      .eq("email", email);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update menu access" });
      return false;
    }
    toast({ title: "Updated", description: `Menu access updated for ${email}` });
    await logAdminAction({
      user,
      action: `Updated menu access for ${email}`,
    });
    fetchAccounts();
    return true;
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, loading, addOrUpdateAccount, deleteAccount, toggleOrderAlerts, updateAllowedMenus, fetchAccounts };
}
