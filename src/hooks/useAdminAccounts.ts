
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AdminRole = "super_admin" | "orders_manager" | "order_staff" | "content_manager" | "content_staff";
export interface AdminAccount {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export function useAdminAccounts() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
    fetchAccounts();
    return true;
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, loading, addOrUpdateAccount, deleteAccount, fetchAccounts };
}
