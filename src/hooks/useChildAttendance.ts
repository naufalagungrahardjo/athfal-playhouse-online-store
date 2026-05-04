import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChildAttendanceRow = {
  record_kind: "checkinout" | "attendance";
  record_id: string;
  student_id: string;
  student_name: string;
  program_id: string | null;
  program_name: string | null;
  meeting_number: number | null;
  event_type: "check_in" | "check_out" | null;
  event_time: string | null;
  photo_url: string | null;
  attendance_status: string | null;
  attendance_date: string | null;
  teacher_email: string | null;
};

export function useChildAttendance() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ChildAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_child_attendance" as any);
    if (!error && data) setRows(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: refresh on relevant table changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("child-attendance-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_checkinout" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "student_attendance" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  return { rows, loading, refetch: fetchData };
}
