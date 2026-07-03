import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Save, Plus, Trash2, CalendarIcon } from "lucide-react";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { hasClassSuperAccess } from "../helpers/classAccess";
import { useProgramSessionDates } from "@/hooks/useProgramSessionDates";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

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
  { value: "none", label: "Not Recorded" },
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
  saveAttendance: (record: Omit<StudentAttendance, "id"> & { session_date?: string }) => Promise<void>;
  refetch: () => Promise<void>;
};

export default function AttendanceTab({ programs, students, enrollments, attendance, saveAttendance, refetch }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { datesForProgram, addDate, deleteDate, getSessionNumber, refetch: refetchDates } = useProgramSessionDates();
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const teacherEmail = user?.email || "";

  // Selected session_date per program
  const [selectedDate, setSelectedDate] = useState<Record<string, string>>({});
  // New date input per program (for "+ Add date")
  const [newDateInput, setNewDateInput] = useState<Record<string, string>>({});
  // Edits keyed by `enrollmentId-sessionDate`
  const [edits, setEdits] = useState<Record<string, Partial<StudentAttendance>>>({});

  const filteredPrograms = useMemo(() => {
    let filtered = programs;
    if (classFilter !== "all") filtered = filtered.filter(p => p.id === classFilter);
    if (filterStart || filterEnd) {
      filtered = filtered.filter(p => {
        if (filterStart && p.end_date < filterStart) return false;
        if (filterEnd && p.start_date > filterEnd) return false;
        return true;
      });
    }
    return filtered;
  }, [programs, filterStart, filterEnd, classFilter]);

  const getKey = (enrollmentId: string, dateStr: string) => `${enrollmentId}|${dateStr}`;

  // Lookup attendance row for (enrollment, date) — by session_date OR fallback to date
  const findAttendance = (enrollmentId: string, dateStr: string, scopeToTeacher: boolean) => {
    return attendance.find(
      a => a.enrollment_id === enrollmentId
        && ((a as any).session_date === dateStr || a.date === dateStr)
        && (!scopeToTeacher || a.teacher_email === teacherEmail)
    );
  };

  // Prefer the current teacher's own row, but fall back to any teacher's row for
  // this (enrollment, date) so descriptive content stays visible to admins and
  // other teachers — matching how the Student Report tab reads all records.
  const findAttendancePreferTeacher = (enrollmentId: string, dateStr: string) => {
    return findAttendance(enrollmentId, dateStr, true) || findAttendance(enrollmentId, dateStr, false);
  };

  const getFieldValue = (enrollmentId: string, dateStr: string, field: string) => {
    const key = getKey(enrollmentId, dateStr);
    if (edits[key] && field in edits[key]) return (edits[key] as any)[field];

    if (field === "attendance_status") {
      const records = attendance
        .filter(a => a.enrollment_id === enrollmentId && (((a as any).session_date === dateStr) || a.date === dateStr))
        .sort((a, b) => (b.id > a.id ? 1 : -1));
      return records.length > 0 ? records[0].attendance_status : "none";
    }
    const existing = findAttendancePreferTeacher(enrollmentId, dateStr);
    return existing ? (existing as any)[field] : "";
  };

  const setField = (enrollmentId: string, dateStr: string, field: string, value: string) => {
    const key = getKey(enrollmentId, dateStr);
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const buildRecord = (enrollmentId: string, dateStr: string, meetingNumber: number) => {
    const fields: any = {};
    for (const f of DESCRIPTIVE_FIELDS.map(d => d.key)) {
      fields[f] = getFieldValue(enrollmentId, dateStr, f);
    }
    return {
      enrollment_id: enrollmentId,
      meeting_number: meetingNumber,
      date: dateStr,
      session_date: dateStr,
      teacher_email: teacherEmail,
      attendance_status: getFieldValue(enrollmentId, dateStr, "attendance_status"),
      ...fields,
    };
  };

  const handleStatusChange = (enrollmentId: string, dateStr: string, value: string) => {
    setField(enrollmentId, dateStr, "attendance_status", value);
  };

  const handleBulkSave = async (programId: string) => {
    const progDates = datesForProgram(programId);
    const dateStr = selectedDate[programId] || progDates[progDates.length - 1]?.session_date || "";
    if (!dateStr) {
      toast({ title: "Pick a session date first", variant: "destructive" });
      return;
    }
    const progEnrollments = enrollments.filter(e => e.program_id === programId);
    let hadError = false;
    for (const enr of progEnrollments) {
      const status = getFieldValue(enr.id, dateStr, "attendance_status");
      const hasDescriptive = DESCRIPTIVE_FIELDS.some(d => {
        const v = getFieldValue(enr.id, dateStr, d.key);
        return v && String(v).trim() !== "";
      });
      if (status === "none" && !hasDescriptive) {
        await supabase
          .from("student_attendance" as any)
          .delete()
          .eq("enrollment_id", enr.id)
          .eq("session_date", dateStr)
          .eq("teacher_email", teacherEmail);
        continue;
      }
      // Manual upsert keyed by (enrollment, session_date, teacher).
      // CRITICAL: preserve existing meeting_number to avoid violating the
      // unique (enrollment_id, meeting_number, teacher_email) constraint.
      // Prefer this teacher's own row; otherwise update whichever row already
      // holds this session's content so we don't create a duplicate row and lose
      // the original author's attribution.
      const existing = findAttendancePreferTeacher(enr.id, dateStr);
      const meetingNumber = existing?.meeting_number ?? getSessionNumber(programId, dateStr) ?? 0;
      const record = buildRecord(enr.id, dateStr, meetingNumber) as any;
      if (existing) {
        // Keep the original row's teacher_email so we edit in place instead of
        // spawning a duplicate under the current user.
        record.teacher_email = existing.teacher_email;
        const { error } = await supabase
          .from("student_attendance" as any)
          .update({ ...record, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) {
          hadError = true;
          toast({ title: "Save failed", description: error.message, variant: "destructive" });
        }
      } else {
        const { error } = await supabase.from("student_attendance" as any).insert(record);
        if (error) {
          hadError = true;
          toast({ title: "Save failed", description: error.message, variant: "destructive" });
        }
      }
    }
    if (!hadError) toast({ title: "Attendance saved" });
    await refetch();
    setEdits(prev => {
      const n = { ...prev };
      for (const enr of progEnrollments) delete n[getKey(enr.id, dateStr)];
      return n;
    });
  };

  const handleAddDate = async (programId: string) => {
    const dateStr = newDateInput[programId];
    if (!dateStr) return;
    const ok = await addDate(programId, dateStr);
    if (ok) {
      setNewDateInput(prev => ({ ...prev, [programId]: "" }));
      setSelectedDate(prev => ({ ...prev, [programId]: dateStr }));
    }
  };

  const handleDeleteDate = async (sessionDateId: string, programId: string, dateStr: string) => {
    if (!confirm(`Remove session ${dateStr}? This will permanently delete attendance AND check-in/out records (including photos) for all students on this date.`)) return;

    // Find enrollments for this program to scope the deletion
    const progEnrollmentIds = enrollments.filter(e => e.program_id === programId).map(e => e.id);

    // Delete attendance records for this date (by session_date or legacy date)
    if (progEnrollmentIds.length > 0) {
      await supabase
        .from("student_attendance" as any)
        .delete()
        .in("enrollment_id", progEnrollmentIds)
        .or(`session_date.eq.${dateStr},date.eq.${dateStr}`);

      // Delete check-in/out records for this date (by session_date)
      await supabase
        .from("student_checkinout" as any)
        .delete()
        .in("enrollment_id", progEnrollmentIds)
        .eq("session_date", dateStr);

      // Also delete legacy check-in/out records that don't have session_date populated
      await supabase
        .from("student_checkinout" as any)
        .delete()
        .in("enrollment_id", progEnrollmentIds)
        .is("session_date", null)
        .gte("event_time", `${dateStr}T00:00:00`)
        .lt("event_time", `${dateStr}T23:59:59.999`);
    }

    // Remove the session date from the dropdown
    await deleteDate(sessionDateId);
    if (selectedDate[programId] === dateStr) {
      setSelectedDate(prev => ({ ...prev, [programId]: "" }));
    }
    await refetch();
    toast({ title: "Session deleted", description: `Removed session ${dateStr} and all related records.` });
  };

  const exportCSV = () => {
    const headers = ["Program", "Session #", "Date", "Student", "Attendance", ...DESCRIPTIVE_FIELDS.map(d => d.label), "Teacher"];
    const rows: string[][] = [];
    for (const prog of filteredPrograms) {
      const dates = datesForProgram(prog.id);
      const progEnrollments = enrollments.filter(e => e.program_id === prog.id);
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        for (const enr of progEnrollments) {
          const student = students.find(s => s.id === enr.student_id);
          const recs = attendance.filter(a => a.enrollment_id === enr.id && (((a as any).session_date === d.session_date) || a.date === d.session_date));
          for (const rec of recs) {
            rows.push([
              prog.name, String(i + 1), d.session_date, student?.name || "", rec.attendance_status,
              ...DESCRIPTIVE_FIELDS.map(f => (rec as any)[f.key] || ""), rec.teacher_email,
            ]);
          }
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
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

      {filteredPrograms.map(prog => {
        const progEnrollments = enrollments.filter(e => e.program_id === prog.id);
        const dates = datesForProgram(prog.id);
        const currentDate = selectedDate[prog.id] || (dates[dates.length - 1]?.session_date ?? "");
        const currentDateRow = dates.find(d => d.session_date === currentDate);
        const sessionNumber = currentDate ? dates.findIndex(d => d.session_date === currentDate) + 1 : 0;

        return (
          <Card key={prog.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-base">{prog.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Label className="text-sm">Session:</Label>
                  <Select value={currentDate} onValueChange={v => setSelectedDate(prev => ({ ...prev, [prog.id]: v }))}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder={dates.length === 0 ? "No sessions yet" : "Pick a session date"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dates.map((d, i) => (
                        <SelectItem key={d.id} value={d.session_date}>
                          Session {i + 1} — {format(parseISO(d.session_date), "EEE, dd MMM yyyy")}
                        </SelectItem>
                      ))}
                      {dates.length === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">No sessions yet — add one below</div>
                      )}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add date</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="end">
                      <Label className="text-xs">New session date</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="date"
                          value={newDateInput[prog.id] || ""}
                          onChange={e => setNewDateInput(prev => ({ ...prev, [prog.id]: e.target.value }))}
                          className="h-9"
                        />
                        <Button size="sm" onClick={() => handleAddDate(prog.id)} disabled={!newDateInput[prog.id]}>Add</Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {currentDateRow && hasClassSuperAccess(user) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Remove this session date"
                      onClick={() => handleDeleteDate(currentDateRow.id, prog.id, currentDate)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}

                  <Button size="sm" onClick={() => handleBulkSave(prog.id)} disabled={!currentDate}>
                    <Save className="h-4 w-4 mr-1" /> Save All
                  </Button>
                </div>
              </div>

              {currentDate && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Editing Session {sessionNumber} — {format(parseISO(currentDate), "EEEE, dd MMMM yyyy")}
                </div>
              )}

              {!currentDate && (
                <p className="text-sm text-muted-foreground py-3">
                  No session dates yet. Sessions are auto-created when teachers check students in, or you can add a date manually above.
                </p>
              )}

              {currentDate && (
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
                                value={getFieldValue(enr.id, currentDate, "attendance_status")}
                                onValueChange={v => handleStatusChange(enr.id, currentDate, v)}
                              >
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
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
                                  value={getFieldValue(enr.id, currentDate, d.key)}
                                  onChange={e => setField(enr.id, currentDate, d.key, e.target.value)}
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
              )}
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
