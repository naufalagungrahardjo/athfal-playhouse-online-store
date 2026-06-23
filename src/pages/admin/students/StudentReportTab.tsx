import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Sparkles, Check } from "lucide-react";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";
import { useProgramSessionDates } from "@/hooks/useProgramSessionDates";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DESCRIPTIVE_FIELDS = [
  { key: "motorik_halus", label: "Motorik Halus" },
  { key: "motorik_kasar", label: "Motorik Kasar" },
  { key: "kognisi", label: "Kognisi" },
  { key: "bahasa", label: "Bahasa" },
  { key: "sosial_emosional", label: "Sosial Emosional" },
  { key: "kemandirian", label: "Kemandirian" },
  { key: "tahsin", label: "Tahsin" },
  { key: "tahfidz", label: "Tahfidz" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  sick_leave: "Sick Leave",
  other_leave: "Other Leave",
  leave: "Leave Permission",
};

type Props = {
  programs: ClassProgram[];
  students: Student[];
  enrollments: StudentEnrollment[];
  attendance: StudentAttendance[];
};

export default function StudentReportTab({ programs, students, enrollments, attendance }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  // Final report (collaborative free text per field, no author shown)
  const [finalReports, setFinalReports] = useState<Record<string, string>>({});
  const [savedReports, setSavedReports] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const { toast } = useToast();
  const { datesForProgram } = useProgramSessionDates();

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Load saved final reports whenever the selected student changes
  useEffect(() => {
    if (!selectedStudentId) { setFinalReports({}); setSavedReports({}); return; }
    (async () => {
      const { data } = await supabase
        .from("student_final_reports")
        .select("field_key,content")
        .eq("student_id", selectedStudentId);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.field_key] = r.content || ""; });
      setFinalReports(map);
      setSavedReports(map);
    })();
  }, [selectedStudentId]);

  const saveFinalReport = useCallback(async (fieldKey: string) => {
    if (!selectedStudentId) return;
    setSavingField(fieldKey);
    try {
      const content = finalReports[fieldKey] ?? "";
      const { error } = await supabase
        .from("student_final_reports")
        .upsert(
          { student_id: selectedStudentId, field_key: fieldKey, content },
          { onConflict: "student_id,field_key" }
        );
      if (error) throw error;
      setSavedReports(prev => ({ ...prev, [fieldKey]: content }));
      toast({ title: "Saved", description: "Final report saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setSavingField(null);
    }
  }, [selectedStudentId, finalReports, toast]);

  // Map teacher email -> display name (from public.users table)
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});

  const teacherEmails = useMemo(() => {
    const set = new Set<string>();
    attendance.forEach(a => { if (a.teacher_email) set.add(a.teacher_email); });
    return Array.from(set);
  }, [attendance]);

  useEffect(() => {
    if (teacherEmails.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("email,name")
        .in("email", teacherEmails);
      const map: Record<string, string> = {};
      (data || []).forEach((u: any) => { if (u.email) map[u.email] = u.name || u.email; });
      setTeacherNames(map);
    })();
  }, [teacherEmails]);

  const displayTeacher = useCallback((email?: string | null) => {
    if (!email) return "";
    return teacherNames[email] || email;
  }, [teacherNames]);

  // Filter students by class
  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students;
    const enrolledStudentIds = new Set(
      enrollments.filter(e => e.program_id === classFilter).map(e => e.student_id)
    );
    return students.filter(s => enrolledStudentIds.has(s.id));
  }, [students, enrollments, classFilter]);

  const studentEnrollments = useMemo(() => {
    if (!selectedStudentId) return [];
    let filtered = enrollments.filter(e => e.student_id === selectedStudentId);
    if (classFilter !== "all") {
      filtered = filtered.filter(e => e.program_id === classFilter);
    }
    return filtered;
  }, [enrollments, selectedStudentId, classFilter]);

  const studentAttendance = useMemo(() => {
    const enrollIds = new Set(studentEnrollments.map(e => e.id));
    return attendance.filter(a => enrollIds.has(a.enrollment_id));
  }, [attendance, studentEnrollments]);

  // Session dates aggregated from program_session_dates across the student's enrolled programs.
  // Each entry: { sessionNumber, dateStr, programIds: Set }
  const sessionList = useMemo(() => {
    const dateSet = new Set<string>();
    for (const enr of studentEnrollments) {
      for (const d of datesForProgram(enr.program_id)) {
        dateSet.add(d.session_date);
      }
    }
    const sorted = Array.from(dateSet).sort();
    return sorted.map((dateStr, i) => ({ sessionNumber: i + 1, dateStr }));
  }, [studentEnrollments, datesForProgram]);

  const maxMeetingNumber = sessionList.length || 1;

  const displaySessions = useMemo(() => {
    if (meetingFilter === "all") return sessionList;
    return sessionList.filter(s => String(s.sessionNumber) === meetingFilter);
  }, [meetingFilter, sessionList]);

  // Get attendance records for a given date (matches session_date or legacy date)
  const recordsForDate = useCallback((dateStr: string) => {
    return studentAttendance.filter(a => ((a as any).session_date === dateStr) || a.date === dateStr);
  }, [studentAttendance]);

  // Build compilation text for each field
  const getCompilation = useCallback((fieldKey: string) => {
    const parts: string[] = [];
    for (const s of sessionList) {
      const recs = recordsForDate(s.dateStr);
      for (const r of recs) {
        const val = (r as any)[fieldKey];
        if (val) parts.push(`Session ${s.sessionNumber}: ${val} [${displayTeacher(r.teacher_email)}]`);
      }
    }
    return parts.join("\n");
  }, [sessionList, recordsForDate, displayTeacher]);

  // Build full compilation for AI summary
  const getFullCompilation = useCallback(() => {
    const parts: string[] = [];
    for (const field of DESCRIPTIVE_FIELDS) {
      const comp = getCompilation(field.key);
      if (comp) parts.push(`${field.label}:\n${comp}`);
    }
    return parts.join("\n\n");
  }, [getCompilation]);

  const generateSummary = async () => {
    const compilation = getFullCompilation();
    if (!compilation.trim()) {
      toast({ title: "No data", description: "No descriptive notes to summarize", variant: "destructive" });
      return;
    }
    setSummaryLoading(true);
    setAiSummary("");
    try {
      const { data, error } = await supabase.functions.invoke("summarize-student", {
        body: { studentName: selectedStudent?.name, compilation },
      });
      if (error) throw error;
      setAiSummary(data?.summary || "No summary generated.");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Failed to generate summary", variant: "destructive" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const programSummaries = useMemo(() => {
    return studentEnrollments.map(enr => {
      const prog = programs.find(p => p.id === enr.program_id);
      const records = studentAttendance.filter(a => a.enrollment_id === enr.id);
      // Dedup by calendar date (session_date if set, else date) — one attendance per day per enrollment.
      const dateMap = new Map<string, StudentAttendance>();
      for (const r of records) {
        const key = (r.session_date || r.date || String(r.meeting_number));
        const existing = dateMap.get(key);
        if (!existing || r.id > existing.id) dateMap.set(key, r);
      }
      const unique = Array.from(dateMap.values());
      return {
        program: prog,
        enrollment: enr,
        present: unique.filter(r => r.attendance_status === "present").length,
        absent: unique.filter(r => r.attendance_status === "absent").length,
        sick_leave: unique.filter(r => r.attendance_status === "sick_leave").length,
        other_leave: unique.filter(r => r.attendance_status === "other_leave").length,
      };
    });
  }, [studentEnrollments, studentAttendance, programs]);

  const exportCSV = () => {
    if (!selectedStudent) return;
    const headers = ["Field", ...displaySessions.map(s => `Session ${s.sessionNumber}`), "Compilation"];
    const rows: string[][] = [];

    rows.push(["Attendance", ...displaySessions.map(s => {
      const recs = recordsForDate(s.dateStr).sort((a, b) => (b.id > a.id ? 1 : -1));
      return recs.length > 0 ? (STATUS_LABELS[recs[0].attendance_status] || recs[0].attendance_status) : "";
    }), ""]);

    for (const field of DESCRIPTIVE_FIELDS) {
      rows.push([field.label, ...displaySessions.map(s => {
        const recs = recordsForDate(s.dateStr);
        return recs.map(r => `${(r as any)[field.key] || ""}${r.teacher_email ? ` [${displayTeacher(r.teacher_email)}]` : ""}`).filter(Boolean).join("; ");
      }), getCompilation(field.key).replace(/\n/g, "; ")]);
    }

    const csv = [headers.join(","), ...rows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `student_report_${selectedStudent.name}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSelectedStudentId(""); setAiSummary(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={v => { setSelectedStudentId(v); setMeetingFilter("all"); setAiSummary(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStudent && (
              <>
                <div className="min-w-[160px]">
                  <Label>Session</Label>
                  <Select value={meetingFilter} onValueChange={setMeetingFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      {sessionList.map(s => (
                        <SelectItem key={s.sessionNumber} value={String(s.sessionNumber)}>
                          Session {s.sessionNumber} — {format(parseISO(s.dateStr), "EEE, d MMM yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          {/* Enrollment & Attendance Summary */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Program Summary — {selectedStudent.name}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Sick Leave</TableHead>
                    <TableHead>Other Leave</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programSummaries.map(ps => (
                    <TableRow key={ps.enrollment.id}>
                      <TableCell className="font-medium">{ps.program?.name || "—"}</TableCell>
                      <TableCell>
                        {ps.program ? `${format(new Date(ps.program.start_date), "EEE, d MMM yyyy")} — ${format(new Date(ps.program.end_date), "EEE, d MMM yyyy")}` : "—"}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">{ps.present}</TableCell>
                      <TableCell className="text-red-600 font-medium">{ps.absent}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{ps.sick_leave}</TableCell>
                      <TableCell className="text-yellow-600 font-medium">{ps.other_leave}</TableCell>
                    </TableRow>
                  ))}
                  {programSummaries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No enrollments</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Descriptive Report */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Descriptive Report</h3>
                <Button variant="outline" size="sm" onClick={generateSummary} disabled={summaryLoading}>
                  {summaryLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  AI Summary
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px] sticky left-0 bg-background z-10">Field</TableHead>
                      {displaySessions.map(s => (
                        <TableHead key={s.sessionNumber} className="min-w-[200px]">
                          Session {s.sessionNumber}
                          <div className="text-[10px] font-normal text-muted-foreground">{format(parseISO(s.dateStr), "EEE, d MMM yyyy")}</div>
                        </TableHead>
                      ))}
                      <TableHead className="min-w-[280px] bg-blue-50">Compilation</TableHead>
                      {aiSummary && <TableHead className="min-w-[300px] bg-purple-50">AI Summary</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Attendance row */}
                    <TableRow>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">Attendance</TableCell>
                      {displaySessions.map(s => {
                        const recs = recordsForDate(s.dateStr).sort((a, b) => (b.id > a.id ? 1 : -1));
                        const status = recs.length > 0 ? recs[0].attendance_status : null;
                        return (
                          <TableCell key={s.sessionNumber}>
                            {status && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                status === "present" ? "bg-green-100 text-green-700" :
                                status === "absent" ? "bg-red-100 text-red-700" :
                                status === "sick_leave" ? "bg-orange-100 text-orange-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {STATUS_LABELS[status] || status}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="bg-blue-50/50 text-xs text-muted-foreground">—</TableCell>
                      {aiSummary && <TableCell className="bg-purple-50/50" rowSpan={DESCRIPTIVE_FIELDS.length + 1}>
                        <div className="text-xs whitespace-pre-wrap max-h-[400px] overflow-y-auto">{aiSummary}</div>
                      </TableCell>}
                    </TableRow>
                    {/* Descriptive fields */}
                    {DESCRIPTIVE_FIELDS.map(field => (
                      <TableRow key={field.key}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">{field.label}</TableCell>
                        {displaySessions.map(s => {
                          const recs = recordsForDate(s.dateStr);
                          return (
                            <TableCell key={s.sessionNumber}>
                              {recs.map(r => {
                                const val = (r as any)[field.key];
                                if (!val) return null;
                                return (
                                  <div key={r.id} className="text-xs mb-1 p-1 rounded bg-muted/50">
                                    <span>{val}</span>
                                    <span className="text-muted-foreground ml-1 italic text-[10px]">— {displayTeacher(r.teacher_email)}</span>
                                  </div>
                                );
                              })}
                            </TableCell>
                          );
                        })}
                        <TableCell className="bg-blue-50/50">
                          <div className="text-xs whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                            {getCompilation(field.key) || <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
