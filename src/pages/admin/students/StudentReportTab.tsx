import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Sparkles } from "lucide-react";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";
import { format } from "date-fns";
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
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const { toast } = useToast();

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const studentEnrollments = useMemo(() => {
    if (!selectedStudentId) return [];
    return enrollments.filter(e => e.student_id === selectedStudentId);
  }, [enrollments, selectedStudentId]);

  const studentAttendance = useMemo(() => {
    const enrollIds = new Set(studentEnrollments.map(e => e.id));
    return attendance.filter(a => enrollIds.has(a.enrollment_id));
  }, [attendance, studentEnrollments]);

  const maxMeetingNumber = useMemo(() => {
    const enrolledProgIds = new Set(studentEnrollments.map(e => e.program_id));
    const enrolledProgs = programs.filter(p => enrolledProgIds.has(p.id));
    return Math.max(1, ...enrolledProgs.map(p => p.num_meetings));
  }, [studentEnrollments, programs]);

  // All meeting numbers from 1 to max
  const allMeetingNumbers = useMemo(() => {
    return Array.from({ length: maxMeetingNumber }, (_, i) => i + 1);
  }, [maxMeetingNumber]);

  const displayMeetings = useMemo(() => {
    if (meetingFilter === "all") return allMeetingNumbers;
    return [Number(meetingFilter)];
  }, [meetingFilter, allMeetingNumbers]);

  // Build compilation text for each field
  const getCompilation = useCallback((fieldKey: string) => {
    const parts: string[] = [];
    for (const m of allMeetingNumbers) {
      const recs = studentAttendance.filter(a => a.meeting_number === m);
      for (const r of recs) {
        const val = (r as any)[fieldKey];
        if (val) parts.push(`Session ${m}: ${val} [${r.teacher_email}]`);
      }
    }
    return parts.join("\n");
  }, [allMeetingNumbers, studentAttendance]);

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
      const meetingMap = new Map<number, StudentAttendance>();
      for (const r of records) {
        const existing = meetingMap.get(r.meeting_number);
        if (!existing || r.id > existing.id) meetingMap.set(r.meeting_number, r);
      }
      const unique = Array.from(meetingMap.values());
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
    const headers = ["Field", ...displayMeetings.map(m => `Session ${m}`), "Compilation"];
    const rows: string[][] = [];

    rows.push(["Attendance", ...displayMeetings.map(m => {
      const recs = studentAttendance.filter(a => a.meeting_number === m).sort((a, b) => (b.id > a.id ? 1 : -1));
      return recs.length > 0 ? (STATUS_LABELS[recs[0].attendance_status] || recs[0].attendance_status) : "";
    }), ""]);

    for (const field of DESCRIPTIVE_FIELDS) {
      rows.push([field.label, ...displayMeetings.map(m => {
        const recs = studentAttendance.filter(a => a.meeting_number === m);
        return recs.map(r => `${(r as any)[field.key] || ""}${r.teacher_email ? ` [${r.teacher_email}]` : ""}`).filter(Boolean).join("; ");
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
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={v => { setSelectedStudentId(v); setMeetingFilter("all"); setAiSummary(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStudent && (
              <>
                <div className="min-w-[160px]">
                  <Label>Meeting</Label>
                  <Select value={meetingFilter} onValueChange={setMeetingFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Meetings</SelectItem>
                      {Array.from({ length: maxMeetingNumber }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Meeting {i + 1}</SelectItem>
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
                        {ps.program ? `${format(new Date(ps.program.start_date), "dd MMM yyyy")} — ${format(new Date(ps.program.end_date), "dd MMM yyyy")}` : "—"}
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
                      {displayMeetings.map(m => (
                        <TableHead key={m} className="min-w-[200px]">Meeting {m}</TableHead>
                      ))}
                      <TableHead className="min-w-[280px] bg-blue-50">Compilation</TableHead>
                      {aiSummary && <TableHead className="min-w-[300px] bg-purple-50">AI Summary</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Attendance row */}
                    <TableRow>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">Attendance</TableCell>
                      {displayMeetings.map(m => {
                        const recs = studentAttendance
                          .filter(a => a.meeting_number === m)
                          .sort((a, b) => (b.id > a.id ? 1 : -1));
                        const status = recs.length > 0 ? recs[0].attendance_status : null;
                        return (
                          <TableCell key={m}>
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
                        {displayMeetings.map(m => {
                          const recs = studentAttendance.filter(a => a.meeting_number === m);
                          return (
                            <TableCell key={m}>
                              {recs.map(r => {
                                const val = (r as any)[field.key];
                                if (!val) return null;
                                return (
                                  <div key={r.id} className="text-xs mb-1 p-1 rounded bg-muted/50">
                                    <span>{val}</span>
                                    <span className="text-muted-foreground ml-1 italic text-[10px]">— {r.teacher_email}</span>
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
