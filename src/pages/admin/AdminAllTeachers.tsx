import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Save, Trash2, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SESSION_OPTIONS = [
  { id: "session1", label: "Session 1: 8:30 - 11:30" },
  { id: "session2", label: "Session 2: 13:00 - 16:00" },
  { id: "session3", label: "Session 3: 16:00 - 17:00" },
];

type Attendance = {
  id: string;
  teacher_email: string;
  date: string;
  arrival_time: string | null;
  leave_time: string | null;
  sessions: string[];
  evidence_url: string | null;
  remarks: string | null;
};

type LeaveRequest = {
  id: string;
  teacher_email: string;
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: string;
  created_at: string;
};

type TeacherSetting = {
  id: string;
  teacher_email: string;
  google_drive_folder: string | null;
};

// Generate month options
const getMonthOptions = () => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(2026, i, 1);
    months.push({ value: String(i), label: format(d, "MMMM") });
  }
  return months;
};

// Generate year options (from 2024 to current year + 1)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= currentYear + 5; y++) {
    years.push(String(y));
  }
  return years;
};

export default function AdminAllTeachers() {
  const { toast } = useToast();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [teacherSettings, setTeacherSettings] = useState<TeacherSetting[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Leave filters
  const [leaveTeacherFilter, setLeaveTeacherFilter] = useState<string>("all");
  const [leaveMonth, setLeaveMonth] = useState<string>("all");
  const [leaveYear, setLeaveYear] = useState<string>("all");

  const [driveEdits, setDriveEdits] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [attRes, leaveRes, settingsRes, teacherAccRes] = await Promise.all([
      supabase.from("teacher_attendance").select("*").order("date", { ascending: false }),
      supabase.from("teacher_leaves").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_settings").select("*"),
      supabase.from("admin_accounts").select("email").eq("role", "teacher"),
    ]);

    if (attRes.data) setAttendances(attRes.data as Attendance[]);
    if (leaveRes.data) setLeaves(leaveRes.data as LeaveRequest[]);
    if (settingsRes.data) setTeacherSettings(settingsRes.data as TeacherSetting[]);

    const teacherEmails = (teacherAccRes.data || []).map((t: any) => t.email);
    setTeachers(teacherEmails);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredAttendances = useMemo(() => {
    return attendances.filter(a => {
      if (teacherFilter !== "all" && a.teacher_email !== teacherFilter) return false;
      if (dateFrom && a.date < dateFrom) return false;
      if (dateTo && a.date > dateTo) return false;
      if (filterMonth !== "all") {
        const month = new Date(a.date).getMonth();
        if (month !== parseInt(filterMonth)) return false;
      }
      if (filterYear !== "all") {
        const year = new Date(a.date).getFullYear();
        if (year !== parseInt(filterYear)) return false;
      }
      return true;
    });
  }, [attendances, teacherFilter, dateFrom, dateTo, filterMonth, filterYear]);

  // Summary: per-teacher attendance stats from filtered data
  const attendanceSummary = useMemo(() => {
    const summary: Record<string, { totalDays: number; totalSessions: number; session1: number; session2: number; session3: number }> = {};
    for (const email of teachers) {
      summary[email] = { totalDays: 0, totalSessions: 0, session1: 0, session2: 0, session3: 0 };
    }
    for (const a of filteredAttendances) {
      if (!summary[a.teacher_email]) {
        summary[a.teacher_email] = { totalDays: 0, totalSessions: 0, session1: 0, session2: 0, session3: 0 };
      }
      const s = summary[a.teacher_email];
      s.totalDays += 1;
      const sessions = a.sessions || [];
      s.totalSessions += sessions.length;
      if (sessions.includes("session1")) s.session1 += 1;
      if (sessions.includes("session2")) s.session2 += 1;
      if (sessions.includes("session3")) s.session3 += 1;
    }
    return summary;
  }, [filteredAttendances, teachers]);

  const handleLeaveStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("teacher_leaves").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update leave status." });
    } else {
      toast({ title: "Updated", description: `Leave request ${status}.` });
      fetchData();
    }
  };

  const handleDeleteAllEvidence = async () => {
    setDeleting(true);
    try {
      // List all files in teacher-evidence bucket
      const { data: files, error: listError } = await supabase.storage
        .from("teacher-evidence")
        .list("", { limit: 1000 });

      if (listError) throw listError;

      // For each teacher subfolder, list and delete files
      const teacherFolders = (files || []).filter(f => !f.id || f.name);
      let totalDeleted = 0;

      for (const folder of teacherFolders) {
        const { data: teacherFiles } = await supabase.storage
          .from("teacher-evidence")
          .list(`${folder.name}`, { limit: 1000 });

        if (teacherFiles && teacherFiles.length > 0) {
          const paths = teacherFiles.map(f => `${folder.name}/${f.name}`);
          const { error: delError } = await supabase.storage
            .from("teacher-evidence")
            .remove(paths);
          if (!delError) totalDeleted += paths.length;
        }
      }

      // Also clear evidence_url from attendance records
      await supabase
        .from("teacher_attendance")
        .update({ evidence_url: null, updated_at: new Date().toISOString() })
        .not("evidence_url", "is", null);

      toast({ title: "Done", description: `Deleted ${totalDeleted} evidence files from storage.` });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete evidence files." });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveDriveFolder = async (teacherEmail: string) => {
    const folder = driveEdits[teacherEmail] ?? "";
    const existing = teacherSettings.find(s => s.teacher_email === teacherEmail);
    let error;
    if (existing) {
      ({ error } = await supabase.from("teacher_settings").update({ google_drive_folder: folder, updated_at: new Date().toISOString() }).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("teacher_settings").insert({ teacher_email: teacherEmail, google_drive_folder: folder }));
    }
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save drive folder." });
    } else {
      toast({ title: "Saved", description: `Drive folder updated for ${teacherEmail}.` });
      fetchData();
    }
  };

  const exportAttendanceCSV = () => {
    const headers = ["Teacher", "Date", "Arrival", "Leave", "Sessions", "Evidence", "Remarks"];
    const rows = filteredAttendances.map(a => [
      a.teacher_email, a.date,
      a.arrival_time ? format(new Date(a.arrival_time), "HH:mm") : "",
      a.leave_time || "",
      (a.sessions || []).map(s => SESSION_OPTIONS.find(o => o.id === s)?.label || s).join("; "),
      a.evidence_url || "", a.remarks || "",
    ]);
    downloadCSV(headers, rows, "teacher_attendance.csv");
  };

  const exportLeavesCSV = () => {
    const headers = ["Teacher", "Start", "End", "Remarks", "Status"];
    const rows = leaves.map(l => [l.teacher_email, l.start_date, l.end_date, l.remarks || "", l.status]);
    downloadCSV(headers, rows, "teacher_leaves.csv");
  };

  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csv = [headers.join(","), ...rows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Teachers Management</h1>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="settings">Teacher Drive Folders</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
        </TabsList>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>All Teacher Attendance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label>Teacher</Label>
                  <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Month</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {getMonthOptions().map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {getYearOptions().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                {(dateFrom || dateTo || filterMonth !== "all" || filterYear !== "all") && (
                  <Button variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); setFilterMonth("all"); setFilterYear("all"); }}>Clear filters</Button>
                )}
                <Button variant="outline" onClick={exportAttendanceCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
              </div>

              {/* Attendance Summary Table */}
              <Card className="bg-muted/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base">Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-center">Total Days</TableHead>
                          <TableHead className="text-center">Total Sessions</TableHead>
                          <TableHead className="text-center">Session 1</TableHead>
                          <TableHead className="text-center">Session 2</TableHead>
                          <TableHead className="text-center">Session 3</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(attendanceSummary).map(([email, s]) => (
                          <TableRow key={email}>
                            <TableCell className="font-medium">{email}</TableCell>
                            <TableCell className="text-center">{s.totalDays}</TableCell>
                            <TableCell className="text-center">{s.totalSessions}</TableCell>
                            <TableCell className="text-center">{s.session1}</TableCell>
                            <TableCell className="text-center">{s.session2}</TableCell>
                            <TableCell className="text-center">{s.session3}</TableCell>
                          </TableRow>
                        ))}
                        {Object.keys(attendanceSummary).length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Attendance Table */}
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Leave</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.teacher_email}</TableCell>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.arrival_time ? format(new Date(a.arrival_time), "HH:mm") : "-"}</TableCell>
                        <TableCell>{a.leave_time || "-"}</TableCell>
                        <TableCell>{(a.sessions || []).map(s => SESSION_OPTIONS.find(o => o.id === s)?.label || s).join(", ") || "-"}</TableCell>
                        <TableCell>
                          {a.evidence_url ? <a href={a.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">View</a> : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{a.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAttendances.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Teacher Google Drive Folders</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher Email</TableHead>
                    <TableHead>Google Drive Folder Link</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map(email => {
                    const existing = teacherSettings.find(s => s.teacher_email === email);
                    const currentVal = driveEdits[email] ?? existing?.google_drive_folder ?? "";
                    return (
                      <TableRow key={email}>
                        <TableCell className="font-medium">{email}</TableCell>
                        <TableCell>
                          <Input
                            value={currentVal}
                            onChange={e => setDriveEdits(prev => ({ ...prev, [email]: e.target.value }))}
                            placeholder="https://drive.google.com/..."
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleSaveDriveFolder(email)} className="gap-1">
                            <Save className="w-3 h-3" /> Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {teachers.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No teachers assigned yet. Add teacher accounts in Admin Accounts.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delete All Evidence Card */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Storage Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Teacher evidence photos are stored in Supabase storage (1 GB free). 
                Average photo size is ~2-5 MB. Use the button below to delete ALL evidence photos 
                to free up storage space. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2" disabled={deleting}>
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "Deleting..." : "Delete All Teacher Evidence Photos"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL teacher evidence photos from Supabase storage 
                      and clear the evidence links from attendance records. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllEvidence} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVES TAB */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Requests</CardTitle>
                <Button variant="outline" size="sm" onClick={exportLeavesCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.teacher_email}</TableCell>
                      <TableCell>{l.start_date}</TableCell>
                      <TableCell>{l.end_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.remarks || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {l.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={() => handleLeaveStatus(l.id, "approved")} className="gap-1">
                              <Check className="w-3 h-3" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleLeaveStatus(l.id, "rejected")} className="gap-1">
                              <X className="w-3 h-3" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No leave requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
