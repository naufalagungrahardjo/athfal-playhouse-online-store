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
import { format } from "date-fns";
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

  // Filter programs by period
  const filteredPrograms = useMemo(() => {
    if (!filterStart && !filterEnd) return programs;
    return programs.filter(p => {
      if (filterStart && p.end_date < filterStart) return false;
      if (filterEnd && p.start_date > filterEnd) return false;
      return true;
    });
  }, [programs, filterStart, filterEnd]);

  // Local edits state keyed by `enrollmentId-meetingNumber`
  const [edits, setEdits] = useState<Record<string, Partial<StudentAttendance>>>({});

  const getKey = (enrollmentId: string, meetingNum: number) => `${enrollmentId}-${meetingNum}`;

  const getFieldValue = (enrollmentId: string, meetingNum: number, field: string) => {
    const key = getKey(enrollmentId, meetingNum);
    if (edits[key] && field in edits[key]) return (edits[key] as any)[field];
    const existing = attendance.find(a => a.enrollment_id === enrollmentId && a.meeting_number === meetingNum);
    return existing ? (existing as any)[field] : (field === "attendance_status" ? "present" : "");
  };

  const setField = (enrollmentId: string, meetingNum: number, field: string, value: string) => {
    const key = getKey(enrollmentId, meetingNum);
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Selected meeting per program
  const [selectedMeeting, setSelectedMeeting] = useState<Record<string, number>>({});

  // Auto-save just the attendance status for a single enrollment
  const handleStatusChange = async (enrollmentId: string, meetingNum: number, value: string) => {
    setField(enrollmentId, meetingNum, "attendance_status", value);
    const fields: any = {};
    for (const f of DESCRIPTIVE_FIELDS.map(d => d.key)) {
      fields[f] = getFieldValue(enrollmentId, meetingNum, f);
    }
    await saveAttendance({
      enrollment_id: enrollmentId,
      meeting_number: meetingNum,
      date: new Date().toISOString().split("T")[0],
      teacher_email: user?.email || "",
      attendance_status: value,
      ...fields,
    });
  };

  // Bulk save all students for a program at the selected meeting
  const handleBulkSave = async (programId: string) => {
    const progEnrollments = enrollments.filter(e => e.program_id === programId);
    const meetingNum = selectedMeeting[programId] || 1;
    for (const enr of progEnrollments) {
      const fields: any = {};
      for (const f of ["attendance_status", ...DESCRIPTIVE_FIELDS.map(d => d.key)]) {
        fields[f] = getFieldValue(enr.id, meetingNum, f);
      }
      await saveAttendance({
        enrollment_id: enr.id,
        meeting_number: meetingNum,
        date: new Date().toISOString().split("T")[0],
        teacher_email: user?.email || "",
        ...fields,
      });
    }
    // Clear all edits for this program
    setEdits(prev => {
      const n = { ...prev };
      for (const enr of progEnrollments) {
        delete n[getKey(enr.id, meetingNum)];
      }
      return n;
    });
  };

  const exportCSV = () => {
    const headers = ["Program", "Student", "Meeting #", "Date", "Attendance", ...DESCRIPTIVE_FIELDS.map(d => d.label), "Teacher"];
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
                <Label className="text-sm">Meeting:</Label>
                <Select value={String(meetingNum)} onValueChange={v => setSelectedMeeting(prev => ({ ...prev, [prog.id]: Number(v) }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: prog.num_meetings }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>Meeting {i + 1}</SelectItem>
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
                      <TableHead className="min-w-[120px]">Attendance</TableHead>
                      {DESCRIPTIVE_FIELDS.map(d => (
                        <TableHead key={d.key} className="min-w-[140px]">{d.label}</TableHead>
                      ))}
                      <TableHead className="w-20">Save</TableHead>
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
                              onValueChange={v => setField(enr.id, meetingNum, "attendance_status", v)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="leave">Leave Permission</SelectItem>
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
                          <TableCell>
                            <Button size="icon" variant="outline" onClick={() => handleSave(enr.id, meetingNum)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {progEnrollments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10 + DESCRIPTIVE_FIELDS.length} className="text-center text-muted-foreground">
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
