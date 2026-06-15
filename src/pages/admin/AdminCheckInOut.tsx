import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Camera, LogIn, LogOut, Loader2, Clock, Search } from "lucide-react";
import { format } from "date-fns";

type Program = { id: string; name: string; num_meetings: number; students_hidden?: boolean };
type Student = { id: string; name: string };
type Enrollment = { id: string; student_id: string; program_id: string };
type CheckRecord = {
  id: string;
  enrollment_id: string;
  program_id: string;
  student_id: string;
  meeting_number: number;
  event_type: "check_in" | "check_out";
  event_time: string;
  photo_url: string | null;
  teacher_email: string;
  session_date?: string | null;
};

// Compress check-in/out photo aggressively while keeping faces recognizable.
// Target: ~800x600, JPEG q=0.75 → typically 60–150 KB per photo.
async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const MAX_W = 800;
  const MAX_H = 600;
  let { width, height } = img;
  const ratio = Math.min(MAX_W / width, MAX_H / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/jpeg", 0.75);
  });
}

export default function AdminCheckInOut() {
  const { user } = useAuth();
  const { toast } = useToast();
  const teacherEmail = user?.email || "";
  const restrictedRole = user?.role === "order_staff" || user?.role === "content_staff";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [todayRecords, setTodayRecords] = useState<CheckRecord[]>([]);
  const [driveFolder, setDriveFolder] = useState<string | null>(null);
  const [teacherRecords, setTeacherRecords] = useState<any[]>([]);
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});

  const [programId, setProgramId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentSearchOpen, setStudentSearchOpen] = useState<boolean>(false);
  const [eventType, setEventType] = useState<"check_in" | "check_out">("check_in");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  // Teacher self attendance
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDisplay = format(new Date(), "EEEE, d MMMM yyyy");
  const [teacherAttendance, setTeacherAttendance] = useState<any | null>(null);
  const [teacherRemarks, setTeacherRemarks] = useState("");
  const [teacherSaving, setTeacherSaving] = useState(false);

  const fetchTeacherAttendance = async () => {
    if (!teacherEmail) return;
    const { data } = await supabase
      .from("teacher_attendance")
      .select("*")
      .eq("teacher_email", teacherEmail)
      .eq("date", today)
      .maybeSingle();
    if (data) {
      setTeacherAttendance(data);
      setTeacherRemarks((data as any).remarks || "");
    }
  };

  useEffect(() => {
    if (teacherEmail) fetchTeacherAttendance();
  }, [teacherEmail]);

  const handleTeacherCheckIn = async () => {
    if (teacherAttendance?.arrival_time) {
      toast({ title: "Already checked in", description: "Arrival already recorded today." });
      return;
    }
    teacherFileInputRef.current?.click();
  };

  const handleTeacherFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setTeacherSaving(true);
    try {
      const compressed = await compressImage(file);
      let evidence_url: string | null = null;
      if (driveFolder) {
        const fd = new FormData();
        fd.append("file", new File([compressed], `teacher_checkin_${Date.now()}.jpg`, { type: "image/jpeg" }));
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/upload-to-drive`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Drive upload failed");
        evidence_url = data.webViewLink;
      } else {
        const filePath = `${teacherEmail}/teacher-attendance/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("teacher-evidence")
          .upload(filePath, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: signed, error: sErr } = await supabase.storage
          .from("teacher-evidence")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        if (sErr) throw sErr;
        evidence_url = signed.signedUrl;
      }
      const now = new Date().toISOString();
      const { error } = await supabase.from("teacher_attendance").insert({
        teacher_email: teacherEmail,
        date: today,
        arrival_time: now,
        remarks: teacherRemarks || null,
        evidence_url,
      });
      if (error) throw error;
      toast({ title: "Checked in", description: `Arrived at ${format(new Date(), "HH:mm")}` });
      fetchTeacherAttendance();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message || "Unknown error" });
    } finally {
      setTeacherSaving(false);
    }
  };

  const handleTeacherCheckOut = async () => {
    if (!teacherAttendance) {
      toast({ variant: "destructive", title: "Check in first", description: "Please record arrival first." });
      return;
    }
    setTeacherSaving(true);
    const { error } = await supabase
      .from("teacher_attendance")
      .update({
        leave_time: format(new Date(), "HH:mm"),
        remarks: teacherRemarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teacherAttendance.id);
    setTeacherSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Checked out", description: "Departure recorded." });
      fetchTeacherAttendance();
    }
  };

  const fetchAll = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pRes, sRes, eRes, rRes, settingsRes, taRes] = await Promise.all([
      supabase.from("class_programs" as any).select("id,name,num_meetings,students_hidden").order("start_date", { ascending: false }),
      supabase.from("students" as any).select("id,name").order("name"),
      supabase.from("student_enrollments" as any).select("id,student_id,program_id"),
      supabase
        .from("student_checkinout" as any)
        .select("*")
        .gte("event_time", todayStart.toISOString())
        .order("event_time", { ascending: false }),
      supabase.from("teacher_settings").select("google_drive_folder").eq("teacher_email", teacherEmail).maybeSingle(),
      supabase
        .from("teacher_attendance")
        .select("*")
        .eq("date", today)
        .order("arrival_time", { ascending: false }),
    ]);
    if (pRes.data) setPrograms(pRes.data as any);
    if (sRes.data) setStudents(sRes.data as any);
    if (eRes.data) setEnrollments(eRes.data as any);
    if (rRes.data) setTodayRecords(rRes.data as any);
    if (settingsRes.data) setDriveFolder((settingsRes.data as any).google_drive_folder || null);
    if (taRes.data) {
      setTeacherRecords(taRes.data as any);
      const emails = Array.from(new Set((taRes.data as any[]).map((t) => t.teacher_email).filter(Boolean)));
      if (emails.length) {
        const { data: uData } = await supabase.from("users").select("email,name").in("email", emails);
        const map: Record<string, string> = {};
        (uData as any[] | null)?.forEach((u) => { if (u.email) map[u.email.toLowerCase()] = u.name; });
        setTeacherNames(map);
      }
    }
  };

  useEffect(() => {
    if (teacherEmail) fetchAll();
  }, [teacherEmail]);

  // Enrollments excluding programs whose students are hidden
  const visibleEnrollments = useMemo(() => {
    const hiddenProgramIds = new Set(programs.filter((p) => p.students_hidden).map((p) => p.id));
    return enrollments.filter((e) => !hiddenProgramIds.has(e.program_id));
  }, [enrollments, programs]);

  // Only show students who are enrolled in at least one visible program
  const enrolledStudents = useMemo(() => {
    const ids = new Set(visibleEnrollments.map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id));
  }, [visibleEnrollments, students]);

  // Programs the selected student is enrolled in
  const studentPrograms = useMemo(() => {
    if (!studentId) return [] as Program[];
    const programIds = new Set(
      visibleEnrollments.filter((e) => e.student_id === studentId).map((e) => e.program_id)
    );
    return programs.filter((p) => programIds.has(p.id) && !p.students_hidden);
  }, [visibleEnrollments, programs, studentId]);

  // Auto-select the program when the student is enrolled in exactly one
  useEffect(() => {
    if (!studentId) {
      setProgramId("");
      return;
    }
    if (studentPrograms.length === 1) {
      if (programId !== studentPrograms[0].id) {
        setProgramId(studentPrograms[0].id);
      }
    } else if (!studentPrograms.find((p) => p.id === programId)) {
      setProgramId("");
    }
  }, [studentId, studentPrograms]);

  const selectedProgram = programs.find((p) => p.id === programId);
  const selectedEnrollment = enrollments.find(
    (e) => e.student_id === studentId && e.program_id === programId
  );

  const handleOpenCamera = () => {
    if (!programId || !studentId || !selectedEnrollment) {
      toast({ variant: "destructive", title: "Incomplete", description: "Please select class and student first." });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset

    if (!selectedEnrollment || !selectedProgram) return;
    setSubmitting(true);

    try {
      const compressed = await compressImage(file);

      let photo_url: string | null = null;
      let photo_storage: "drive" | "supabase" = "supabase";

      if (driveFolder) {
        // Upload to Drive via existing edge function
        const fd = new FormData();
        fd.append("file", new File([compressed], `checkin_${Date.now()}.jpg`, { type: "image/jpeg" }));
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/upload-to-drive`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Drive upload failed");
        photo_url = data.webViewLink;
        photo_storage = "drive";
      } else {
        // Fallback to Supabase storage
        const filePath = `${teacherEmail}/checkinout/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("teacher-evidence")
          .upload(filePath, compressed, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: signed, error: sErr } = await supabase.storage
          .from("teacher-evidence")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
        if (sErr) throw sErr;
        photo_url = signed.signedUrl;
        photo_storage = "supabase";
      }

      const today = new Date();
      const sessionDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const { error: insErr } = await supabase.from("student_checkinout" as any).insert({
        enrollment_id: selectedEnrollment.id,
        program_id: programId,
        student_id: studentId,
        meeting_number: 0,
        session_date: sessionDateStr,
        event_type: eventType,
        photo_url,
        photo_storage,
        teacher_email: teacherEmail,
      } as any);

      if (insErr) {
        if (insErr.code === "23505") {
          throw new Error(`This student is already ${eventType === "check_in" ? "checked in" : "checked out"} for this session.`);
        }
        throw insErr;
      }

      toast({
        title: eventType === "check_in" ? "Checked in" : "Checked out",
        description: eventType === "check_in" ? "Student marked as present." : "Check-out recorded.",
      });
      setStudentId("");
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = (id: string) => students.find((s) => s.id === id)?.name || "—";
  const programName = (id: string) => programs.find((p) => p.id === id)?.name || "—";
  const teacherDisplayName = (email: string) =>
    teacherNames[email?.toLowerCase()] || email?.split("@")[0] || "—";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Check-In / Check-Out Record</h1>
      <p className="text-sm text-muted-foreground">
        Take a photo of the student to record their arrival or departure. Check-in automatically marks attendance as present.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" /> My Attendance — {todayDisplay}
          </CardTitle>
          {user?.name && (
            <p className="text-sm text-muted-foreground pl-6">{user.name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1.5 rounded-md bg-muted">
              Arrival: <strong>{teacherAttendance?.arrival_time ? format(new Date(teacherAttendance.arrival_time), "HH:mm") : "—"}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-md bg-muted">
              Leave: <strong>{teacherAttendance?.leave_time || "—"}</strong>
            </span>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={teacherRemarks}
              onChange={(e) => setTeacherRemarks(e.target.value)}
              placeholder="Write any notes for today..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleTeacherCheckIn}
              disabled={teacherSaving || !!teacherAttendance?.arrival_time}
              variant="default"
              className="gap-2"
            >
              {teacherSaving && !teacherAttendance?.arrival_time ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              Check In
            </Button>
            <Button
              onClick={handleTeacherCheckOut}
              disabled={teacherSaving || !teacherAttendance?.arrival_time || !!teacherAttendance?.leave_time}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" /> Check Out
            </Button>
          </div>
          <input
            ref={teacherFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleTeacherFileChosen}
          />
        </CardContent>
      </Card>

      {!restrictedRole && (<Card>
        <CardHeader>
          <CardTitle className="text-base">Student Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Student</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  if (studentId) setStudentId("");
                  setStudentSearchOpen(true);
                }}
                onFocus={() => setStudentSearchOpen(true)}
                onBlur={() => setTimeout(() => setStudentSearchOpen(false), 150)}
                placeholder="Type student name (e.g. Alc)..."
                className="pl-9"
              />
              {studentSearchOpen && studentSearch.trim() && !studentId && (
                <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-[240px] overflow-y-auto">
                  {(() => {
                    const matches = enrolledStudents.filter((s) =>
                      s.name.toLowerCase().includes(studentSearch.trim().toLowerCase())
                    );
                    if (matches.length === 0) {
                      return <div className="px-3 py-2 text-sm text-muted-foreground">No students found</div>;
                    }
                    return matches.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setStudentId(s.id);
                          setStudentSearch(s.name);
                          setStudentSearchOpen(false);
                        }}
                      >
                        {s.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
            <Select
              value={studentId}
              onValueChange={(v) => {
                setStudentId(v);
                const s = enrolledStudents.find((x) => x.id === v);
                if (s) setStudentSearch(s.name);
                setStudentSearchOpen(false);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Or select from dropdown">
                  {studentId ? enrolledStudents.find((s) => s.id === studentId)?.name : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {enrolledStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {studentId && studentPrograms.length > 1 && (
            <div>
              <Label>Class</Label>
              <Select value={programId} onValueChange={(v) => setProgramId(v)}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  {studentPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {studentId && studentPrograms.length === 1 && selectedProgram && (
            <div>
              <Label>Class</Label>
              <p className="text-sm px-3 py-2 rounded border bg-muted">{selectedProgram.name}</p>
            </div>
          )}

          {studentId && studentPrograms.length === 0 && (
            <p className="text-sm text-destructive">This student is not enrolled in any class.</p>
          )}

          {selectedProgram && (
            <div className="rounded border bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">Session date</p>
              <p className="text-sm font-medium">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Session number is assigned automatically based on today's date.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChosen}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => { setEventType("check_in"); setTimeout(() => handleOpenCamera(), 0); }}
              disabled={submitting || !programId || !studentId}
              className="h-14 text-base gap-2"
            >
              {submitting && eventType === "check_in" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              Check In
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setEventType("check_out"); setTimeout(() => handleOpenCamera(), 0); }}
              disabled={submitting || !programId || !studentId}
              className="h-14 text-base gap-2"
            >
              {submitting && eventType === "check_out" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              Check Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Storage: {driveFolder ? "Google Drive" : "Supabase (no Drive folder configured)"}
          </p>
        </CardContent>
      </Card>)}

      {!restrictedRole && (<Card>
        <CardHeader>
          <CardTitle className="text-base">Student Record</CardTitle>
        </CardHeader>
        <CardContent>
          {todayRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet today.</p>
          ) : (
            <ul className="divide-y">
              {todayRecords.map((r) => (
                <li key={r.id} className="py-2 flex items-center gap-3">
                  {r.photo_url ? (
                    <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={r.photo_url} alt="evidence" className="w-12 h-12 object-cover rounded border" />
                    </a>
                  ) : (
                    <div className="w-12 h-12 rounded border bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{studentName(r.student_id)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {programName(r.program_id)} · Session {r.meeting_number || "—"}
                      {r.session_date ? ` · ${format(new Date(r.session_date), "EEE, d MMM yyyy")}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${r.event_type === "check_in" ? "text-green-600" : "text-orange-600"}`}>
                      {r.event_type === "check_in" ? "IN" : "OUT"}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.event_time), "HH:mm")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>)}

      {!restrictedRole && (<Card>
        <CardHeader>
          <CardTitle className="text-base">Teachers Record</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teacher records yet today.</p>
          ) : (
            <ul className="divide-y">
              {teacherRecords.map((t) => (
                <li key={t.id} className="py-2 flex items-center gap-3">
                  {t.evidence_url ? (
                    <a href={t.evidence_url} target="_blank" rel="noopener noreferrer">
                      <img src={t.evidence_url} alt="evidence" className="w-12 h-12 object-cover rounded border" />
                    </a>
                  ) : (
                    <div className="w-12 h-12 rounded border bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{teacherDisplayName(t.teacher_email)}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.teacher_email}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs">
                      <span className="font-semibold text-green-600">IN</span>{" "}
                      <span className="text-muted-foreground">
                        {t.arrival_time ? format(new Date(t.arrival_time), "HH:mm") : "—"}
                      </span>
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold text-orange-600">OUT</span>{" "}
                      <span className="text-muted-foreground">{t.leave_time || "—"}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>)}
    </div>
  );
}