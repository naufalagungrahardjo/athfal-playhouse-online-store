import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";
import { format } from "date-fns";

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

type Props = {
  programs: ClassProgram[];
  students: Student[];
  enrollments: StudentEnrollment[];
  attendance: StudentAttendance[];
};

export default function StudentReportTab({ programs, students, enrollments, attendance }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Get all enrollments & attendance for selected student
  const studentEnrollments = useMemo(() => {
    if (!selectedStudentId) return [];
    return enrollments.filter(e => e.student_id === selectedStudentId);
  }, [enrollments, selectedStudentId]);

  const studentAttendance = useMemo(() => {
    const enrollIds = new Set(studentEnrollments.map(e => e.id));
    return attendance.filter(a => enrollIds.has(a.enrollment_id));
  }, [attendance, studentEnrollments]);

  // Summary: per program attendance counts
  const programSummaries = useMemo(() => {
    return studentEnrollments.map(enr => {
      const prog = programs.find(p => p.id === enr.program_id);
      const records = studentAttendance.filter(a => a.enrollment_id === enr.id);
      const present = records.filter(r => r.attendance_status === "present").length;
      const absent = records.filter(r => r.attendance_status === "absent").length;
      const leave = records.filter(r => r.attendance_status === "leave").length;
      return { program: prog, enrollment: enr, records, present, absent, leave };
    });
  }, [studentEnrollments, studentAttendance, programs]);

  // Unique dates from attendance
  const dates = useMemo(() => {
    const d = [...new Set(studentAttendance.map(a => a.date))].sort();
    return d;
  }, [studentAttendance]);

  const exportCSV = () => {
    if (!selectedStudent) return;
    const headers = ["Field", ...dates.map(d => format(new Date(d), "dd MMM yyyy"))];
    const rows: string[][] = [];

    // Attendance row
    rows.push(["Attendance", ...dates.map(d => {
      const rec = studentAttendance.find(a => a.date === d);
      return rec?.attendance_status || "";
    })]);

    // Descriptive rows
    for (const field of DESCRIPTIVE_FIELDS) {
      rows.push([field.label, ...dates.map(d => {
        const recs = studentAttendance.filter(a => a.date === d);
        return recs.map(r => `${(r as any)[field.key] || ""}${r.teacher_email ? ` [${r.teacher_email}]` : ""}`).join("; ");
      })]);
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
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
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
              <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
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
                    <TableHead>Leave</TableHead>
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
                      <TableCell className="text-yellow-600 font-medium">{ps.leave}</TableCell>
                    </TableRow>
                  ))}
                  {programSummaries.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No enrollments</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Descriptive Report by Date */}
          {dates.length > 0 && (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <h3 className="font-semibold mb-3">Descriptive Report</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px] sticky left-0 bg-background z-10">Field</TableHead>
                      {dates.map(d => (
                        <TableHead key={d} className="min-w-[180px]">{format(new Date(d), "dd MMM yyyy")}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Attendance row */}
                    <TableRow>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">Attendance</TableCell>
                      {dates.map(d => {
                        const recs = studentAttendance.filter(a => a.date === d);
                        return (
                          <TableCell key={d}>
                            {recs.map(r => (
                              <span key={r.id} className={`text-xs px-1.5 py-0.5 rounded ${
                                r.attendance_status === "present" ? "bg-green-100 text-green-700" :
                                r.attendance_status === "absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {r.attendance_status}
                              </span>
                            ))}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {/* Descriptive fields */}
                    {DESCRIPTIVE_FIELDS.map(field => (
                      <TableRow key={field.key}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">{field.label}</TableCell>
                        {dates.map(d => {
                          const recs = studentAttendance.filter(a => a.date === d);
                          return (
                            <TableCell key={d}>
                              {recs.map(r => {
                                const val = (r as any)[field.key];
                                if (!val) return null;
                                return (
                                  <div key={r.id} className="text-xs mb-1">
                                    <span>{val}</span>
                                    <span className="text-muted-foreground ml-1 italic">— {r.teacher_email}</span>
                                  </div>
                                );
                              })}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
