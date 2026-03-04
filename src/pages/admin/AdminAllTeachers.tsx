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
import { Check, X, Save, Trash2 } from "lucide-react";
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

  // Drive folder edits
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

    // Build teachers list from admin_accounts with role=teacher
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
      return true;
    });
  }, [attendances, teacherFilter, dateFrom, dateTo]);

  const handleLeaveStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("teacher_leaves").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update leave status." });
    } else {
      toast({ title: "Updated", description: `Leave request ${status}.` });
      fetchData();
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
                <div><Label>From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
                {(dateFrom || dateTo) && <Button variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear dates</Button>}
              </div>
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
        </TabsContent>

        {/* LEAVES TAB */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
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
