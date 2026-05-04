import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ProgramSessionDate = {
  id: string;
  program_id: string;
  session_date: string; // YYYY-MM-DD
  created_at: string;
};

export function useProgramSessionDates() {
  const [sessionDates, setSessionDates] = useState<ProgramSessionDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("program_session_dates" as any)
      .select("*")
      .order("session_date", { ascending: true });
    if (error) {
      console.error(error);
    } else if (data) {
      setSessionDates(data as any);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addDate = async (programId: string, dateStr: string): Promise<boolean> => {
    const { error } = await supabase.rpc("add_program_session_date" as any, {
      p_program_id: programId,
      p_session_date: dateStr,
    });
    if (error) {
      toast({ title: "Failed to add date", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Session date added" });
    await fetchAll();
    return true;
  };

  const deleteDate = async (id: string) => {
    const { error } = await supabase.from("program_session_dates" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Session date removed" });
    await fetchAll();
  };

  // Get sorted dates for a given program (ascending)
  const datesForProgram = (programId: string): ProgramSessionDate[] => {
    return sessionDates
      .filter((d) => d.program_id === programId)
      .sort((a, b) => a.session_date.localeCompare(b.session_date));
  };

  // Get session number (1-based) for a (program, date)
  const getSessionNumber = (programId: string, dateStr: string): number => {
    const list = datesForProgram(programId);
    const idx = list.findIndex((d) => d.session_date === dateStr);
    return idx >= 0 ? idx + 1 : 0;
  };

  return { sessionDates, loading, addDate, deleteDate, datesForProgram, getSessionNumber, refetch: fetchAll };
}
