import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, Save } from "lucide-react";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";

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

const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "sick_leave", label: "Sick Leave" },
  { value: "other_leave", label: "Other Leave" },
];

type Props = {
  programs: ClassProgram[];
  students: Student[];
  enrollments: StudentEnrollment[];
  attendance: StudentAttendance[];
  saveAttendance: (record: Omit<StudentAttendance, "id">) => Promise<void>;
};

export default function AttendanceTab({ programs, students, enrollments, attendance, saveAttendance }: Props) {
  const { user } = useAuth();
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const teacherEmail = user?.email || "";

  const filteredPrograms = useMemo(() => {
    let filtered = programs;
    if (classFilter !== "all") {
      filtered = filtered.filter(p => p.id === classFilter);
    }
    if (filterStart || filterEnd) {
      filtered = filtered.filter(p => {
        if (filterStart && p.end_date < filterStart) return false;
        if (filterEnd && p.start_date > filterEnd) return false;
        return true;
      });
    }
    return filtered;
  }, [programs, filterStart, filterEnd, classFilter]);

  // Local edits state keyed by `enrollmentId-meetingNumber`
  const [edits, setEdits] = useState<Record<string, Partial<StudentAttendance>>>({});
  const [selectedMeeting, setSelectedMeeting] = useState<Record<string, number>>({});

  const getKey = (enrollmentId: string, meetingNum: number) => `${enrollmentId}-${meetingNum}`;

  // Get field value: for descriptive fields, use current teacher's record; for attendance_status, use latest record
  const getFieldValue = (enrollmentId: string, meetingNum: number, field: string) => {
    const key = getKey(enrollmentId, meetingNum);
    if (edits[key] && field in edits[key]) return (edits[key] as any)[field];
    
    if (field === "attendance_status") {
      // For attendance status, get the latest record (any teacher)
      const records = attendance
        .filter(a => a.enrollment_id === enrollmentId && a.meeting_number === meetingNum)
        .sort((a, b) => (b.id > a.id ? 1 : -1)); // latest first
      return records.length > 0 ? records[0].attendance_status : "present";
    }
    
    // For descriptive fields, get current teacher's record
    const existing = attendance.find(
      a => a.enrollment_id === enrollmentId && a.meeting_number === meetingNum && a.teacher_email === teacherEmail
    );
    return existing ? (existing as any)[field] : "";
  };

  const setField = (enrollmentId: string, meetingNum: number, field: string, value: string) => {
    const key = getKey(enrollmentId, meetingNum);
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const buildRecord = (enrollmentId: string, meetingNum: number, overrides?: Record<string, string>) => {
    const fields: any = {};
    for (const f of DESCRIPTIVE_FIELDS.map(d => d.key)) {
      fields[f] = overrides?.[f] ?? getFieldValue(enrollmentId, meetingNum, f);
    }
    return {
      enrollment_id: enrollmentId,
      meeting_number: meetingNum,
      date: new Date().toISOString().split("T")[0],
      teacher_email: teacherEmail,
      attendance_status: overrides?.attendance_status ?? getFieldValue(enrollmentId, meetingNum, "attendance_status"),
      ...fields,
    };
  };

  // Just update local state for attendance status (saved with Save All)
  const handleStatusChange = (enrollmentId: string, meetingNum: number, value: string) => {
    setField(enrollmentId, meetingNum, "attendance_status", value);
  };

  // Bulk save all students for a program at the selected meeting
  const handleBulkSave = async (programId: string) => {
    const progEnrollments = enrollments.filter(e => e.program_id === programId);
    const meetingNum = selectedMeeting[programId] || 1;
    for (const enr of progEnrollments) {
      await saveAttendance(buildRecord(enr.id, meetingNum));
    }
    setEdits(prev => {
      const n = { ...prev };
      for (const enr of progEnrollments) {
        delete n[getKey(enr.id, meetingNum)];
      }
      return n;
    });
  };

  // Attendance summary per program
  const getAttendanceSummary = (programId: string) => {
    const progEnrollments = enrollments.filter(e => e.program_id === programId);
    return progEnrollments.map(enr => {
      const student = students.find(s => s.id === enr.student_id);
      // Get unique meetings (deduplicate by meeting_number, take latest)
      const records = attendance.filter(a => a.enrollment_id === enr.id);
      const meetingMap = new Map<number, StudentAttendance>();
      for (const r of records) {
        const existing = meetingMap.get(r.meeting_number);
        if (!existing || r.id > existing.id) meetingMap.set(r.meeting_number, r);
      }
      const uniqueRecords = Array.from(meetingMap.values());
      return {
        studentName: student?.name || "—",
        present: uniqueRecords.filter(r => r.attendance_status === "present").length,
        absent: uniqueRecords.filter(r => r.attendance_status === "absent").length,
        sick_leave: uniqueRecords.filter(r => r.attendance_status === "sick_leave").length,
        other_leave: uniqueRecords.filter(r => r.attendance_status === "other_leave").length,
      };
    });
  };

  const exportCSV = () => {
    const headers = ["Program", "Student", "Session #", "Date", "Attendance", ...DESCRIPTIVE_FIELDS.map(d => d.label), "Teacher"];
    const rows: string[][] = [];
    for (const prog of filteredPrograms) {
      const progEnrollments = enrollments.filter(e => e.program_id === prog.id);
      for (const enr of progEnrollments) {
        const student = students.find(s => s.id === enr.student_id);
        const records = attendance.filter(a => a.enrollment_id === enr.id);
        for (const rec of records) {
          rows.push([
            prog.name, student?.name || "", String(rec.meeting_number), rec.date, rec.attendance_status,
            ...DESCRIPTIVE_FIELDS.map(d => (rec as any)[d.key] || ""), rec.teacher_email,
          ]);
        }
      }
    }
    const csv = [headers.join(","), ...rows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance_report.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Period Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Period Start</Label>
              <Input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div>
              <Label>Period End</Label>
              <Input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      {filteredPrograms.map(prog => {
        const summary = getAttendanceSummary(prog.id);
        if (summary.length === 0) return null;
        return (
          <Card key={`summary-${prog.id}`}>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-base mb-2">{prog.name} — Attendance Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Sick Leave</TableHead>
                    <TableHead>Other Leave</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.studentName}</TableCell>
                      <TableCell className="text-green-600 font-medium">{s.present}</TableCell>
                      <TableCell className="text-red-600 font-medium">{s.absent}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{s.sick_leave}</TableCell>
                      <TableCell className="text-yellow-600 font-medium">{s.other_leave}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Per-program attendance tables */}
      {filteredPrograms.map(prog => {
        const progEnrollments = enrollments.filter(e => e.program_id === prog.id);
        const meetingNum = selectedMeeting[prog.id] || 1;

        return (
          <Card key={prog.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-base">{prog.name}</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Session:</Label>
                  <Select value={String(meetingNum)} onValueChange={v => setSelectedMeeting(prev => ({ ...prev, [prog.id]: Number(v) }))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: prog.num_meetings }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Session {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleBulkSave(prog.id)}>
                    <Save className="h-4 w-4 mr-1" /> Save All
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Student</TableHead>
                      <TableHead className="min-w-[130px]">Attendance</TableHead>
                      {DESCRIPTIVE_FIELDS.map(d => (
                        <TableHead key={d.key} className="min-w-[140px]">{d.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progEnrollments.map(enr => {
                      const student = students.find(s => s.id === enr.student_id);
                      return (
                        <TableRow key={enr.id}>
                          <TableCell className="font-medium">{student?.name || "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={getFieldValue(enr.id, meetingNum, "attendance_status")}
                              onValueChange={v => handleStatusChange(enr.id, meetingNum, v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ATTENDANCE_STATUSES.map(s => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {DESCRIPTIVE_FIELDS.map(d => (
                            <TableCell key={d.key}>
                              <Textarea
                                className="min-w-[120px] text-xs"
                                rows={2}
                                value={getFieldValue(enr.id, meetingNum, d.key)}
                                onChange={e => setField(enr.id, meetingNum, d.key, e.target.value)}
                                placeholder={d.label}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                    {progEnrollments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2 + DESCRIPTIVE_FIELDS.length} className="text-center text-muted-foreground">
                          No students enrolled in this program
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filteredPrograms.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No programs match the selected period</p>
      )}
    </div>
  );
}
