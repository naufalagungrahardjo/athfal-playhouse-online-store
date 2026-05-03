import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BillingNotice {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingNoticeAssignment {
  id: string;
  notice_id: string;
  order_id: string;
  created_at: string;
}

export const useBillingNotices = () => {
  const [notices, setNotices] = useState<BillingNotice[]>([]);
  const [assignments, setAssignments] = useState<BillingNoticeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: n, error: ne }, { data: a, error: ae }] = await Promise.all([
      supabase.from("billing_notices").select("*").order("created_at", { ascending: false }),
      supabase.from("billing_notice_assignments").select("*"),
    ]);
    if (ne) toast({ title: "Failed to load notices", description: ne.message, variant: "destructive" });
    if (ae) toast({ title: "Failed to load assignments", description: ae.message, variant: "destructive" });
    setNotices((n as BillingNotice[]) || []);
    setAssignments((a as BillingNoticeAssignment[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createNotice = async (input: Omit<BillingNotice, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("billing_notices")
      .insert(input)
      .select()
      .single();
    if (error) {
      toast({ title: "Failed to create notice", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "Billing notice created" });
    await fetchAll();
    return data as BillingNotice;
  };

  const updateNotice = async (id: string, patch: Partial<Omit<BillingNotice, "id" | "created_at" | "updated_at">>) => {
    const { error } = await supabase.from("billing_notices").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Billing notice updated" });
    await fetchAll();
    return true;
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabase.from("billing_notices").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Billing notice deleted" });
    await fetchAll();
    return true;
  };

  const assignToOrders = async (noticeId: string, orderIds: string[]) => {
    if (!orderIds.length) return true;
    const rows = orderIds.map((order_id) => ({ notice_id: noticeId, order_id }));
    const { error } = await supabase
      .from("billing_notice_assignments")
      .upsert(rows, { onConflict: "notice_id,order_id", ignoreDuplicates: true });
    if (error) {
      toast({ title: "Failed to assign", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: `Assigned to ${orderIds.length} order(s)` });
    await fetchAll();
    return true;
  };

  const unassign = async (assignmentId: string) => {
    const { error } = await supabase.from("billing_notice_assignments").delete().eq("id", assignmentId);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchAll();
    return true;
  };

  const unassignByOrderAndNotice = async (noticeId: string, orderId: string) => {
    const { error } = await supabase
      .from("billing_notice_assignments")
      .delete()
      .eq("notice_id", noticeId)
      .eq("order_id", orderId);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchAll();
    return true;
  };

  return {
    notices,
    assignments,
    loading,
    refetch: fetchAll,
    createNotice,
    updateNotice,
    deleteNotice,
    assignToOrders,
    unassign,
    unassignByOrderAndNotice,
  };
};