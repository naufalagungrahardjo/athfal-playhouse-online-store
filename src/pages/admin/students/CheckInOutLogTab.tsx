import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { ClassProgram, Student } from "@/hooks/useStudents";

type Row = {
  id: string;
  enrollment_id: string;
  program_id: string;
  student_id: string;
  meeting_number: number;
  event_type: "check_in" | "check_out";
  event_time: string;
  photo_url: string | null;
  teacher_email: string;
};

type Props = { programs: ClassProgram[]; students: Student[] };

export default function CheckInOutLogTab({ programs, students }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("student_checkinout" as any)
      .select("*")
      .order("event_time", { ascending: false })
      .limit(1000);
    if (data) setRows(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (classFilter !== "all" && r.program_id !== classFilter) return false;
      if (studentFilter !== "all" && r.student_id !== studentFilter) return false;
      const d = r.event_time.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, classFilter, studentFilter, from, to]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name || "—";
  const programName = (id: string) => programs.find((p) => p.id === id)?.name || "—";

  const exportCSV = () => {
    const headers = ["Date", "Time", "Class", "Session", "Student", "Event", "Teacher", "Photo URL"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      lines.push(
        [
          format(new Date(r.event_time), "yyyy-MM-dd"),
          format(new Date(r.event_time), "HH:mm"),
          programName(r.program_id),
          String(r.meeting_number),
          studentName(r.student_id),
          r.event_type,
          r.teacher_email,
          r.photo_url || "",
        ]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "check_in_out_log.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <Label>Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  <SelectItem value="all">All Classes</SelectItem>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Label>Student</Label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
            <Button variant="ghost" onClick={fetchRows}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.event_time), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{format(new Date(r.event_time), "HH:mm")}</TableCell>
                    <TableCell>{studentName(r.student_id)}</TableCell>
                    <TableCell>{programName(r.program_id)}</TableCell>
                    <TableCell>{r.meeting_number}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold ${r.event_type === "check_in" ? "text-green-600" : "text-orange-600"}`}>
                        {r.event_type === "check_in" ? "IN" : "OUT"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.photo_url ? (
                        <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="underline text-primary text-xs">View</a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{r.teacher_email}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No records</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}