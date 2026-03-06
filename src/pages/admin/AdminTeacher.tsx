import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Send, CalendarDays, FileText } from "lucide-react";
import { format } from "date-fns";

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
  created_at: string;
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

export default function AdminTeacher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const email = user?.email || "";

  // Attendance state
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [leaveTime, setLeaveTime] = useState("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [uploading, setUploading] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [driveFolder, setDriveFolder] = useState<string | null>(null);

  // Leave state
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveRemarks, setLeaveRemarks] = useState("");

  // Filter
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchData = async () => {
    const [attRes, leaveRes, settingsRes] = await Promise.all([
      supabase.from("teacher_attendance").select("*").eq("teacher_email", email).order("date", { ascending: false }),
      supabase.from("teacher_leaves").select("*").eq("teacher_email", email).order("created_at", { ascending: false }),
      supabase.from("teacher_settings").select("*").eq("teacher_email", email).maybeSingle(),
    ]);
    if (attRes.data) {
      setAttendances(attRes.data as Attendance[]);
      const todayRec = attRes.data.find((a: any) => a.date === today);
      if (todayRec) {
        setTodayAttendance(todayRec as Attendance);
        setLeaveTime(todayRec.leave_time || "");
        setSessions(todayRec.sessions || []);
        setRemarks(todayRec.remarks || "");
        setEvidenceUrl(todayRec.evidence_url || null);
      }
    }
    if (leaveRes.data) setLeaves(leaveRes.data as LeaveRequest[]);
    console.log("[TeacherDashboard] Settings query result:", settingsRes.data, "error:", settingsRes.error);
    if (settingsRes.data) {
      const folder = (settingsRes.data as any).google_drive_folder || null;
      console.log("[TeacherDashboard] Drive folder ID:", folder);
      setDriveFolder(folder);
    }
  };

  useEffect(() => { if (email) fetchData(); }, [email]);

  const handleClockIn = async () => {
    if (todayAttendance?.arrival_time) {
      toast({ title: "Already clocked in", description: "You already recorded your arrival today." });
      return;
    }
    const now = new Date().toISOString();
    if (todayAttendance) {
      await supabase.from("teacher_attendance").update({ arrival_time: now, updated_at: now }).eq("id", todayAttendance.id);
    } else {
      await supabase.from("teacher_attendance").insert({ teacher_email: email, date: today, arrival_time: now });
    }
    toast({ title: "Arrival recorded", description: `Clocked in at ${format(new Date(), "HH:mm")}` });
    fetchData();
  };

  const handleSaveAttendance = async () => {
    if (!todayAttendance) {
      toast({ variant: "destructive", title: "Clock in first", description: "Please record your arrival time first." });
      return;
    }
    const { error } = await supabase.from("teacher_attendance").update({
      leave_time: leaveTime,
      sessions,
      remarks,
      evidence_url: evidenceUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", todayAttendance.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save attendance." });
    } else {
      toast({ title: "Saved", description: "Attendance updated." });
      fetchData();
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      if (driveFolder) {
        // Upload to Google Drive via edge function
        const formData = new FormData();
        formData.append("file", file);

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/upload-to-drive`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setEvidenceUrl(data.webViewLink);
        toast({ title: "Uploaded to Google Drive", description: "Evidence photo saved to your Drive folder." });
      } else {
        // Fallback to private Supabase storage bucket
        const filePath = `${email}/${today}-${Date.now()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from("teacher-evidence").upload(filePath, file);
        if (error) throw error;
        const { data: signedData, error: signError } = await supabase.storage
          .from("teacher-evidence")
          .createSignedUrl(filePath, 86400); // 24 hour expiry
        if (signError) throw signError;
        setEvidenceUrl(signedData.signedUrl);
        toast({ title: "Uploaded", description: "Evidence image uploaded." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message || "Unknown error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!leaveStart || !leaveEnd) {
      toast({ variant: "destructive", title: "Missing dates", description: "Please fill start and end dates." });
      return;
    }
    const { error } = await supabase.from("teacher_leaves").insert({
      teacher_email: email,
      start_date: leaveStart,
      end_date: leaveEnd,
      remarks: leaveRemarks || null,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit leave request." });
    } else {
      toast({ title: "Submitted", description: "Leave request submitted." });
      setLeaveStart(""); setLeaveEnd(""); setLeaveRemarks("");
      fetchData();
    }
  };

  const filteredAttendances = useMemo(() => {
    if (dateFilter === "all") return attendances;
    return attendances.filter(a => {
      if (filterFrom && a.date < filterFrom) return false;
      if (filterTo && a.date > filterTo) return false;
      return true;
    });
  }, [attendances, dateFilter, filterFrom, filterTo]);

  const totalDays = filteredAttendances.length;
  const totalLeaves = leaves.filter(l => l.status === "approved" && (dateFilter === "all" || ((!filterFrom || l.start_date >= filterFrom) && (!filterTo || l.end_date <= filterTo)))).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Daily Attendance</TabsTrigger>
          <TabsTrigger value="recap">Attendance Recap</TabsTrigger>
          <TabsTrigger value="leave">Leave Request</TabsTrigger>
        </TabsList>

        {/* DAILY ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Today&apos;s Attendance — {today}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={handleClockIn} disabled={!!todayAttendance?.arrival_time} className="gap-2">
                  <Clock className="w-4 h-4" />
                  {todayAttendance?.arrival_time ? `Arrived at ${format(new Date(todayAttendance.arrival_time), "HH:mm")}` : "Record Arrival"}
                </Button>
              </div>

              {todayAttendance?.arrival_time && (
                <>
                  <div>
                    <Label>Time of Leave (24h format)</Label>
                    <Input type="time" value={leaveTime} onChange={e => setLeaveTime(e.target.value)} />
                  </div>
                  <div>
                    <Label>Session Attendance</Label>
                    <div className="flex flex-col gap-2 mt-1">
                      {SESSION_OPTIONS.map(s => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={sessions.includes(s.id)}
                            onCheckedChange={(checked) => {
                              setSessions(prev => checked ? [...prev, s.id] : prev.filter(x => x !== s.id));
                            }}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Upload Evidence (Picture)</Label>
                    {driveFolder && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Google Drive folder: <a href={driveFolder} target="_blank" rel="noopener noreferrer" className="underline text-primary">{driveFolder}</a>
                      </p>
                    )}
                    <Input type="file" accept="image/*" onChange={handleUploadEvidence} disabled={uploading} />
                    {evidenceUrl && <img src={evidenceUrl} alt="Evidence" className="mt-2 w-32 h-32 object-cover rounded border" />}
                  </div>
                  <div>
                    <Label>Remarks</Label>
                    <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Write any notes..." />
                  </div>
                  <Button onClick={handleSaveAttendance} className="gap-2"><Send className="w-4 h-4" /> Save Attendance</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECAP TAB */}
        <TabsContent value="recap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Attendance Recap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label>Filter</Label>
                  <Select value={dateFilter} onValueChange={v => { setDateFilter(v); if (v === "all") { setFilterFrom(""); setFilterTo(""); } }}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateFilter === "custom" && (
                  <>
                    <div><Label>From</Label><Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} /></div>
                    <div><Label>To</Label><Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} /></div>
                  </>
                )}
              </div>
              <div className="flex gap-4 text-sm">
                <span>Total Attendance Days: <strong>{totalDays}</strong></span>
                <span>Approved Leaves: <strong>{totalLeaves}</strong></span>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Leave</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.arrival_time ? format(new Date(a.arrival_time), "HH:mm") : "-"}</TableCell>
                        <TableCell>{a.leave_time || "-"}</TableCell>
                        <TableCell>{(a.sessions || []).map(s => SESSION_OPTIONS.find(o => o.id === s)?.label || s).join(", ") || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{a.remarks || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAttendances.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVE TAB */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Submit Leave Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} /></div>
              </div>
              <div><Label>Remarks</Label><Textarea value={leaveRemarks} onChange={e => setLeaveRemarks(e.target.value)} placeholder="Reason for leave..." /></div>
              <Button onClick={handleSubmitLeave} className="gap-2"><Send className="w-4 h-4" /> Submit Leave</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>My Leave Requests</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{l.start_date}</TableCell>
                      <TableCell>{l.end_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.remarks || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>
                          {l.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No leave requests</TableCell></TableRow>
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
