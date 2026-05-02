import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClassProgram, Student, StudentEnrollment, StudentAttendance } from "@/hooks/useStudents";

type Props = {
  programs: ClassProgram[];
  students: Student[];
  enrollments: StudentEnrollment[];
  attendance: StudentAttendance[];
};

export default function AttendanceSummaryTab({ programs, students, enrollments, attendance }: Props) {
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [classFilter, setClassFilter] = useState("all");

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

  const getAttendanceSummary = (programId: string) => {
    const progEnrollments = enrollments.filter(e => e.program_id === programId);
    return progEnrollments.map(enr => {
      const student = students.find(s => s.id === enr.student_id);
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
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
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
          </div>
        </CardContent>
      </Card>

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

      {filteredPrograms.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No programs match the selected period</p>
      )}
    </div>
  );
}
