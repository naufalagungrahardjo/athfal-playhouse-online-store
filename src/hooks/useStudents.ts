import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ClassProgram = {
  id: string;
  name: string;
  num_meetings: number;
  start_date: string;
  end_date: string;
};

export type Student = {
  id: string;
  name: string;
  enrolled_programs: string[]; // program ids
};

export type StudentEnrollment = {
  id: string;
  student_id: string;
  program_id: string;
};

export type StudentAttendance = {
  id: string;
  enrollment_id: string;
  meeting_number: number;
  date: string;
  attendance_status: string;
  motorik_halus: string;
  motorik_kasar: string;
  kognisi: string;
  bahasa: string;
  sosial_emosional: string;
  kemandirian: string;
  tahsin: string;
  tahfidz: string;
  teacher_email: string;
};

export function useStudents() {
  const [programs, setPrograms] = useState<ClassProgram[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, eRes, aRes] = await Promise.all([
        supabase.from("class_programs" as any).select("*").order("start_date", { ascending: false }),
        supabase.from("students" as any).select("*").order("name"),
        supabase.from("student_enrollments" as any).select("*"),
        supabase.from("student_attendance" as any).select("*").order("meeting_number"),
      ]);

      if (pRes.data) setPrograms(pRes.data as any);
      if (sRes.data) {
        const enrollData = eRes.data as any[] || [];
        const studentsWithEnroll = (sRes.data as any[]).map((s: any) => ({
          ...s,
          enrolled_programs: enrollData.filter((e: any) => e.student_id === s.id).map((e: any) => e.program_id),
        }));
        setStudents(studentsWithEnroll);
      }
      if (eRes.data) setEnrollments(eRes.data as any);
      if (aRes.data) setAttendance(aRes.data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Program CRUD
  const addProgram = async (p: Omit<ClassProgram, "id">) => {
    const { error } = await supabase.from("class_programs" as any).insert(p as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Program created" });
    fetchAll();
  };

  const updateProgram = async (id: string, p: Partial<ClassProgram>) => {
    const { error } = await supabase.from("class_programs" as any).update({ ...p, updated_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Program updated" });
    fetchAll();
  };

  const deleteProgram = async (id: string) => {
    const { error } = await supabase.from("class_programs" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Program deleted" });
    fetchAll();
  };

  // Student CRUD
  const addStudent = async (name: string, programIds: string[]) => {
    const { data, error } = await supabase.from("students" as any).insert({ name } as any).select().single();
    if (error || !data) { toast({ title: "Error", description: error?.message, variant: "destructive" }); return; }
    if (programIds.length > 0) {
      const rows = programIds.map(pid => ({ student_id: (data as any).id, program_id: pid }));
      await supabase.from("student_enrollments" as any).insert(rows as any);
    }
    toast({ title: "Student added" });
    fetchAll();
  };

  const updateStudentEnrollments = async (studentId: string, programIds: string[]) => {
    await supabase.from("student_enrollments" as any).delete().eq("student_id", studentId);
    if (programIds.length > 0) {
      const rows = programIds.map(pid => ({ student_id: studentId, program_id: pid }));
      await supabase.from("student_enrollments" as any).insert(rows as any);
    }
    toast({ title: "Enrollments updated" });
    fetchAll();
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.from("students" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Student deleted" });
    fetchAll();
  };

  // Attendance - now unique by (enrollment_id, meeting_number, teacher_email)
  const saveAttendance = async (record: Omit<StudentAttendance, "id">) => {
    const existing = attendance.find(
      a => a.enrollment_id === record.enrollment_id && a.meeting_number === record.meeting_number && a.teacher_email === record.teacher_email
    );
    if (existing) {
      const { error } = await supabase.from("student_attendance" as any)
        .update({ ...record, updated_at: new Date().toISOString() } as any)
        .eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("student_attendance" as any).insert(record as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Attendance saved" });
    fetchAll();
  };

  return {
    programs, students, enrollments, attendance, loading,
    addProgram, updateProgram, deleteProgram,
    addStudent, updateStudentEnrollments, deleteStudent,
    saveAttendance, refetch: fetchAll,
  };
}
