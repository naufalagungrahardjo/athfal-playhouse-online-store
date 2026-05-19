import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRole } from "./helpers/getAdminRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check, X, Save, Trash2, Download, ImageOff } from "lucide-react";
import ClassMaterialsTab from "./team/ClassMaterialsTab";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
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
  const { user } = useAuth();
  const isSuperAdmin = getAdminRole(user) === "super_admin";
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
  const [deletingAttendance, setDeletingAttendance] = useState(false);

  // Late threshold (HH:mm) - stored in website_copy id='attendance_settings'
  const [lateThreshold, setLateThreshold] = useState<string>("08:30");
  const [thresholdInput, setThresholdInput] = useState<string>("08:30");
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Student check-in/out management (super_admin only)
  type CheckRecord = {
    id: string;
    student_id: string;
    program_id: string;
    teacher_email: string;
    event_type: "check_in" | "check_out";
    event_time: string;
    photo_url: string | null;
    session_date: string | null;
  };
  const [checkRecords, setCheckRecords] = useState<CheckRecord[]>([]);
  const [studentList, setStudentList] = useState<{ id: string; name: string }[]>([]);
  const [programList, setProgramList] = useState<{ id: string; name: string }[]>([]);
  const [ciClass, setCiClass] = useState("all");
  const [ciStudent, setCiStudent] = useState("all");
  const [ciTeacher, setCiTeacher] = useState("all");
  const [ciFrom, setCiFrom] = useState("");
  const [ciTo, setCiTo] = useState("");
  const [ciBusy, setCiBusy] = useState(false);

  // Storage usage (Supabase free tier: 1 GB)
  const FREE_TIER_BYTES = 1024 * 1024 * 1024;
  const [storageUsage, setStorageUsage] = useState<{ bucket_id: string; file_count: number; total_bytes: number }[]>([]);

  const fetchStorageUsage = async () => {
    const { data, error } = await supabase.rpc("get_storage_usage" as any);
    if (!error && data) setStorageUsage(data as any);
  };

  const fetchData = async () => {
    setLoading(true);
    const [attRes, leaveRes, settingsRes, teacherAccRes, ciRes, stuRes, progRes] = await Promise.all([
      supabase.from("teacher_attendance").select("*").order("date", { ascending: false }),
      supabase.from("teacher_leaves").select("*").order("created_at", { ascending: false }),
      supabase.from("teacher_settings").select("*"),
      supabase.from("admin_accounts").select("email").eq("role", "teacher"),
      supabase
        .from("student_checkinout" as any)
        .select("id,student_id,program_id,teacher_email,event_type,event_time,photo_url,session_date")
        .order("event_time", { ascending: false })
        .limit(2000),
      supabase.from("students" as any).select("id,name").order("name"),
      supabase.from("class_programs" as any).select("id,name").order("name"),
    ]);

    if (attRes.data) setAttendances(attRes.data as Attendance[]);
    if (leaveRes.data) setLeaves(leaveRes.data as LeaveRequest[]);
    if (settingsRes.data) setTeacherSettings(settingsRes.data as TeacherSetting[]);
    if (ciRes.data) setCheckRecords(ciRes.data as any);
    if (stuRes.data) setStudentList(stuRes.data as any);
    if (progRes.data) setProgramList(progRes.data as any);

    const teacherEmails = (teacherAccRes.data || []).map((t: any) => t.email);
    setTeachers(teacherEmails);

    // Load late threshold
    const { data: thresholdRow } = await supabase
      .from("website_copy")
      .select("content")
      .eq("id", "attendance_settings")
      .maybeSingle();
    const tVal = (thresholdRow as any)?.content?.late_threshold;
    if (tVal && typeof tVal === "string") {
      setLateThreshold(tVal);
      setThresholdInput(tVal);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isSuperAdmin) fetchStorageUsage();
  }, [isSuperAdmin]);

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

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (leaveTeacherFilter !== "all" && l.teacher_email !== leaveTeacherFilter) return false;
      if (leaveMonth !== "all") {
        const month = new Date(l.start_date).getMonth();
        if (month !== parseInt(leaveMonth)) return false;
      }
      if (leaveYear !== "all") {
        const year = new Date(l.start_date).getFullYear();
        if (year !== parseInt(leaveYear)) return false;
      }
      return true;
    });
  }, [leaves, leaveTeacherFilter, leaveMonth, leaveYear]);

  // Leave summary per teacher
  const leaveSummary = useMemo(() => {
    const summary: Record<string, { total: number; approved: number; rejected: number; pending: number }> = {};
    for (const email of teachers) {
      summary[email] = { total: 0, approved: 0, rejected: 0, pending: 0 };
    }
    for (const l of filteredLeaves) {
      if (!summary[l.teacher_email]) {
        summary[l.teacher_email] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      const s = summary[l.teacher_email];
      s.total += 1;
      if (l.status === "approved") s.approved += 1;
      else if (l.status === "rejected") s.rejected += 1;
      else s.pending += 1;
    }
    return summary;
  }, [filteredLeaves, teachers]);

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

  // ---- Student Check-In/Out management (super_admin only) ----
  const filteredCheckRecords = useMemo(() => {
    return checkRecords.filter((r) => {
      if (ciClass !== "all" && r.program_id !== ciClass) return false;
      if (ciStudent !== "all" && r.student_id !== ciStudent) return false;
      if (ciTeacher !== "all" && r.teacher_email !== ciTeacher) return false;
      const d = (r.session_date || r.event_time.slice(0, 10));
      if (ciFrom && d < ciFrom) return false;
      if (ciTo && d > ciTo) return false;
      return true;
    });
  }, [checkRecords, ciClass, ciStudent, ciTeacher, ciFrom, ciTo]);

  // Convert a Supabase storage public/signed URL into the object path inside the bucket
  const extractStoragePath = (url: string): string | null => {
    try {
      const marker = "/teacher-evidence/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      let path = url.slice(idx + marker.length);
      const q = path.indexOf("?");
      if (q !== -1) path = path.slice(0, q);
      // Some signed URLs have format /object/sign/teacher-evidence/<path>
      return decodeURIComponent(path);
    } catch {
      return null;
    }
  };

  const collectStoragePaths = (records: CheckRecord[]) => {
    const paths: string[] = [];
    for (const r of records) {
      if (!r.photo_url) continue;
      const p = extractStoragePath(r.photo_url);
      if (p) paths.push(p);
    }
    return paths;
  };

  const handleDeleteCheckPhotos = async () => {
    if (filteredCheckRecords.length === 0) {
      toast({ title: "Nothing to delete", description: "No records match the current filters." });
      return;
    }
    setCiBusy(true);
    try {
      const paths = collectStoragePaths(filteredCheckRecords);
      let removed = 0;
      // Remove in batches of 100
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error } = await supabase.storage.from("teacher-evidence").remove(batch);
        if (!error) removed += batch.length;
      }
      // Clear photo_url for the affected rows
      const ids = filteredCheckRecords.filter((r) => r.photo_url).map((r) => r.id);
      if (ids.length > 0) {
        await supabase.from("student_checkinout" as any).update({ photo_url: null } as any).in("id", ids);
      }
      toast({ title: "Photos deleted", description: `${removed} photo(s) removed from storage.` });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete photos." });
    } finally {
      setCiBusy(false);
    }
  };

  const handleDeleteCheckRecords = async () => {
    if (filteredCheckRecords.length === 0) {
      toast({ title: "Nothing to delete", description: "No records match the current filters." });
      return;
    }
    setCiBusy(true);
    try {
      // First, remove their photos from storage
      const paths = collectStoragePaths(filteredCheckRecords);
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        await supabase.storage.from("teacher-evidence").remove(batch);
      }
      // Then delete DB rows
      const ids = filteredCheckRecords.map((r) => r.id);
      const { error } = await supabase.from("student_checkinout" as any).delete().in("id", ids);
      if (error) throw error;
      toast({ title: "Records deleted", description: `${ids.length} check-in/out record(s) removed.` });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete records." });
    } finally {
      setCiBusy(false);
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

  const handleDeleteAttendanceHistory = async () => {
    if (filteredAttendances.length === 0) {
      toast({ title: "Nothing to delete", description: "No attendance records match the current filters." });
      return;
    }
    setDeletingAttendance(true);
    try {
      const ids = filteredAttendances.map(a => a.id);
      const { error } = await supabase.from("teacher_attendance").delete().in("id", ids);
      if (error) throw error;
      const scope = teacherFilter === "all" ? "all teachers" : teacherFilter;
      toast({ title: "Deleted", description: `${ids.length} attendance record(s) for ${scope} removed.` });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete attendance records." });
    } finally {
      setDeletingAttendance(false);
    }
  };

  const handleSaveThreshold = async () => {
    if (!/^\d{2}:\d{2}$/.test(thresholdInput)) {
      toast({ variant: "destructive", title: "Invalid time", description: "Use HH:mm format (e.g. 08:30)." });
      return;
    }
    setSavingThreshold(true);
    try {
      const { error } = await supabase
        .from("website_copy")
        .upsert({ id: "attendance_settings", content: { late_threshold: thresholdInput } as any }, { onConflict: "id" });
      if (error) throw error;
      setLateThreshold(thresholdInput);
      toast({ title: "Saved", description: `Late threshold set to ${thresholdInput}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to save threshold." });
    } finally {
      setSavingThreshold(false);
    }
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
        <TabsList className="flex w-full overflow-x-auto justify-start">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="settings">Teacher Drive Folders</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
          <TabsTrigger value="materials">Class Materials</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="student_checkinout">Student Check-In/Out</TabsTrigger>
          )}
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
                {isSuperAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-1" disabled={deletingAttendance}>
                        <Trash2 className="w-4 h-4" />
                        {deletingAttendance ? "Deleting..." : "Delete Attendance History"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete attendance history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{filteredAttendances.length}</strong> attendance record(s) for{" "}
                          <strong>{teacherFilter === "all" ? "ALL teachers" : teacherFilter}</strong>
                          {(dateFrom || dateTo || filterMonth !== "all" || filterYear !== "all") ? " matching the current date filters" : ""}.
                          This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAttendanceHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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

          {/* Delete All Evidence Card — super_admin only */}
          {isSuperAdmin && (
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
          )}
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
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label>Teacher</Label>
                  <Select value={leaveTeacherFilter} onValueChange={setLeaveTeacherFilter}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Month</Label>
                  <Select value={leaveMonth} onValueChange={setLeaveMonth}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {getMonthOptions().map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Select value={leaveYear} onValueChange={setLeaveYear}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {getYearOptions().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {(leaveTeacherFilter !== "all" || leaveMonth !== "all" || leaveYear !== "all") && (
                  <Button variant="ghost" onClick={() => { setLeaveTeacherFilter("all"); setLeaveMonth("all"); setLeaveYear("all"); }}>Clear filters</Button>
                )}
              </div>

              {/* Leave Summary Table */}
              <Card className="bg-muted/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base">Leave Summary</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Approved</TableHead>
                          <TableHead className="text-center">Rejected</TableHead>
                          <TableHead className="text-center">Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(leaveSummary).map(([email, s]) => (
                          <TableRow key={email}>
                            <TableCell className="font-medium">{email}</TableCell>
                            <TableCell className="text-center">{s.total}</TableCell>
                            <TableCell className="text-center">{s.approved}</TableCell>
                            <TableCell className="text-center">{s.rejected}</TableCell>
                            <TableCell className="text-center">{s.pending}</TableCell>
                          </TableRow>
                        ))}
                        {Object.keys(leaveSummary).length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Leave Table */}
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
                  {filteredLeaves.map(l => (
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
                  {filteredLeaves.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No leave requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* CLASS MATERIALS TAB */}
        <TabsContent value="materials">
          <ClassMaterialsTab />
        </TabsContent>

        {/* STUDENT CHECK-IN/OUT TAB — super_admin only */}
        {isSuperAdmin && (
        <TabsContent value="student_checkinout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Check-In / Check-Out Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Filter records by class, student, teacher, and date range. You can delete only the
                photos (keeps the log row) or delete the entire records (removes log + photos).
              </p>

              {/* Storage usage indicator */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HardDrive className="w-4 h-4" />
                    Supabase Storage Usage
                  </div>
                  <Button size="sm" variant="ghost" onClick={fetchStorageUsage}>Refresh</Button>
                </div>
                {(() => {
                  const totalBytes = storageUsage.reduce((s, b) => s + Number(b.total_bytes || 0), 0);
                  const totalFiles = storageUsage.reduce((s, b) => s + Number(b.file_count || 0), 0);
                  const pct = Math.min(100, (totalBytes / FREE_TIER_BYTES) * 100);
                  const fmt = (n: number) => {
                    if (n >= 1024 * 1024 * 1024) return (n / (1024 * 1024 * 1024)).toFixed(2) + " GB";
                    if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
                    if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
                    return n + " B";
                  };
                  const evidence = storageUsage.find((b) => b.bucket_id === "teacher-evidence");
                  const images = storageUsage.find((b) => b.bucket_id === "images");
                  return (
                    <>
                      <Progress value={pct} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {fmt(totalBytes)} of 1 GB used ({pct.toFixed(1)}%) · {totalFiles} files
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="rounded border p-2">
                          <div className="font-medium">teacher-evidence (check-in/out photos)</div>
                          <div className="text-muted-foreground">
                            {fmt(Number(evidence?.total_bytes || 0))} · {Number(evidence?.file_count || 0)} files
                          </div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="font-medium">images (website assets)</div>
                          <div className="text-muted-foreground">
                            {fmt(Number(images?.total_bytes || 0))} · {Number(images?.file_count || 0)} files
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1">
                        Photos are auto-compressed to ~480x360 JPEG (~30–60 KB each). At ~50 KB per
                        photo, the 1 GB free tier holds roughly 20,000 photos. Use the delete tools
                        below to free space, or set a Google Drive folder per teacher to offload
                        photos off Supabase.
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label>Class</Label>
                  <Select value={ciClass} onValueChange={setCiClass}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      <SelectItem value="all">All Classes</SelectItem>
                      {programList.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student</Label>
                  <Select value={ciStudent} onValueChange={setCiStudent}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      <SelectItem value="all">All Students</SelectItem>
                      {studentList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Teacher</Label>
                  <Select value={ciTeacher} onValueChange={setCiTeacher}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>From</Label><Input type="date" value={ciFrom} onChange={(e) => setCiFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={ciTo} onChange={(e) => setCiTo(e.target.value)} /></div>
                {(ciClass !== "all" || ciStudent !== "all" || ciTeacher !== "all" || ciFrom || ciTo) && (
                  <Button variant="ghost" onClick={() => { setCiClass("all"); setCiStudent("all"); setCiTeacher("all"); setCiFrom(""); setCiTo(""); }}>Clear filters</Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded border border-destructive/40 bg-destructive/5 p-3">
                <div className="text-sm">
                  <span className="font-semibold">{filteredCheckRecords.length}</span> record(s) match the current filters.
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2" disabled={ciBusy || filteredCheckRecords.length === 0}>
                        <ImageOff className="w-4 h-4" /> Delete Photos Only
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete photos for {filteredCheckRecords.length} record(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the photo files from storage and clears their links, but keeps the check-in/out log entries. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCheckPhotos}>Delete Photos</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2" disabled={ciBusy || filteredCheckRecords.length === 0}>
                        <Trash2 className="w-4 h-4" /> Delete Records
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {filteredCheckRecords.length} record(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes the selected check-in/out log entries and their photos from storage. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCheckRecords} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCheckRecords.slice(0, 500).map((r) => {
                      const sName = studentList.find((s) => s.id === r.student_id)?.name || "—";
                      const pName = programList.find((p) => p.id === r.program_id)?.name || "—";
                      const d = r.session_date || r.event_time.slice(0, 10);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{d}</TableCell>
                          <TableCell>{format(new Date(r.event_time), "HH:mm")}</TableCell>
                          <TableCell>{sName}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{pName}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold ${r.event_type === "check_in" ? "text-green-600" : "text-orange-600"}`}>
                              {r.event_type === "check_in" ? "IN" : "OUT"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {r.photo_url
                              ? <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">View</a>
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{r.teacher_email}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCheckRecords.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredCheckRecords.length > 500 && (
                  <p className="text-xs text-muted-foreground mt-2">Showing first 500 of {filteredCheckRecords.length}. Delete actions still apply to all matched records.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
