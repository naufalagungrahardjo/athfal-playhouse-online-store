import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, LogIn, LogOut, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Program = { id: string; name: string; num_meetings: number };
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
};

// Compress an image File to max 640x480 JPEG @ ~0.7 quality
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
  const MAX_W = 640;
  const MAX_H = 480;
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
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress failed"))), "image/jpeg", 0.72);
  });
}

export default function AdminCheckInOut() {
  const { user } = useAuth();
  const { toast } = useToast();
  const teacherEmail = user?.email || "";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [todayRecords, setTodayRecords] = useState<CheckRecord[]>([]);
  const [driveFolder, setDriveFolder] = useState<string | null>(null);

  const [programId, setProgramId] = useState<string>("");
  const [meetingNumber, setMeetingNumber] = useState<string>("1");
  const [studentId, setStudentId] = useState<string>("");
  const [eventType, setEventType] = useState<"check_in" | "check_out">("check_in");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pRes, sRes, eRes, rRes, settingsRes] = await Promise.all([
      supabase.from("class_programs" as any).select("id,name,num_meetings").order("start_date", { ascending: false }),
      supabase.from("students" as any).select("id,name").order("name"),
      supabase.from("student_enrollments" as any).select("id,student_id,program_id"),
      supabase
        .from("student_checkinout" as any)
        .select("*")
        .gte("event_time", todayStart.toISOString())
        .order("event_time", { ascending: false }),
      supabase.from("teacher_settings").select("google_drive_folder").eq("teacher_email", teacherEmail).maybeSingle(),
    ]);
    if (pRes.data) setPrograms(pRes.data as any);
    if (sRes.data) setStudents(sRes.data as any);
    if (eRes.data) setEnrollments(eRes.data as any);
    if (rRes.data) setTodayRecords(rRes.data as any);
    if (settingsRes.data) setDriveFolder((settingsRes.data as any).google_drive_folder || null);
  };

  useEffect(() => {
    if (teacherEmail) fetchAll();
  }, [teacherEmail]);

  const programEnrollments = useMemo(
    () => enrollments.filter((e) => e.program_id === programId),
    [enrollments, programId]
  );
  const programStudents = useMemo(() => {
    const ids = new Set(programEnrollments.map((e) => e.student_id));
    return students.filter((s) => ids.has(s.id));
  }, [programEnrollments, students]);
  const selectedProgram = programs.find((p) => p.id === programId);
  const selectedEnrollment = programEnrollments.find((e) => e.student_id === studentId);

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

      const { error: insErr } = await supabase.from("student_checkinout" as any).insert({
        enrollment_id: selectedEnrollment.id,
        program_id: programId,
        student_id: studentId,
        meeting_number: Number(meetingNumber),
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

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Check-In / Check-Out Record</h1>
      <p className="text-sm text-muted-foreground">
        Take a photo of the student to record their arrival or departure. Check-in automatically marks attendance as present.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Class</Label>
            <Select value={programId} onValueChange={(v) => { setProgramId(v); setStudentId(""); setMeetingNumber("1"); }}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProgram && (
            <div>
              <Label>Session</Label>
              <Select value={meetingNumber} onValueChange={setMeetingNumber}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  {Array.from({ length: selectedProgram.num_meetings }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Session {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={!programId}>
              <SelectTrigger><SelectValue placeholder={programId ? "Select student" : "Select class first"} /></SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {programStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={eventType === "check_in" ? "default" : "outline"}
                onClick={() => setEventType("check_in")}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" /> Check In
              </Button>
              <Button
                type="button"
                variant={eventType === "check_out" ? "default" : "outline"}
                onClick={() => setEventType("check_out")}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" /> Check Out
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChosen}
          />

          <Button
            onClick={handleOpenCamera}
            disabled={submitting || !programId || !studentId}
            className="w-full h-14 text-base gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {submitting ? "Uploading..." : "Open Camera & Submit"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Storage: {driveFolder ? "Google Drive" : "Supabase (no Drive folder configured)"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Records</CardTitle>
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
                      {programName(r.program_id)} · Session {r.meeting_number}
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
      </Card>
    </div>
  );
}