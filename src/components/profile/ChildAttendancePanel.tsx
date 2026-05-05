import { useMemo, useState } from "react";
import { useChildAttendance, ChildAttendanceRow } from "@/hooks/useChildAttendance";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CalendarCheck, ImageIcon, Sparkles, X } from "lucide-react";
import { format } from "date-fns";

type GroupKey = string;
type DayGroup = {
  key: GroupKey;
  studentName: string;
  programName: string | null;
  date: Date;
  checkIn?: ChildAttendanceRow;
  checkOut?: ChildAttendanceRow;
  attendance?: ChildAttendanceRow;
};

const statusColor = (status: string | null | undefined) => {
  switch ((status || "").toLowerCase()) {
    case "present":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "absent":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "sick":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "permission":
    case "izin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-muted text-foreground";
  }
};

function formatDuration(inIso?: string, outIso?: string) {
  if (!inIso || !outIso) return null;
  const ms = new Date(outIso).getTime() - new Date(inIso).getTime();
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const hr = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hr > 0) return `${hr}hr ${min}min`;
  return `${min}min`;
}

const ChildAttendancePanel = () => {
  const { language } = useLanguage();
  const { rows, loading } = useChildAttendance();
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);

  const students = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.student_id, r.student_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const groups: DayGroup[] = useMemo(() => {
    const filtered = studentFilter === "all" ? rows : rows.filter((r) => r.student_id === studentFilter);
    const map = new Map<GroupKey, DayGroup>();

    for (const r of filtered) {
      const dateStr =
        r.record_kind === "checkinout" && r.event_time
          ? r.event_time.slice(0, 10)
          : r.attendance_date || "";
      if (!dateStr) continue;
      const key = `${r.student_id}__${r.program_id || "none"}__${dateStr}__${r.meeting_number ?? ""}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          studentName: r.student_name,
          programName: r.program_name,
          date: new Date(dateStr),
        };
        map.set(key, g);
      }
      if (r.record_kind === "checkinout") {
        if (r.event_type === "check_in") g.checkIn = r;
        else if (r.event_type === "check_out") g.checkOut = r;
      } else {
        g.attendance = r;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [rows, studentFilter]);

  // Latest group per student (so each child gets their own greeting banner)
  const latestKeyByStudent = useMemo(() => {
    const seen = new Map<string, GroupKey>();
    for (const g of groups) {
      const sid = g.attendance?.student_id || g.checkIn?.student_id || g.checkOut?.student_id || g.studentName;
      if (!seen.has(sid)) seen.set(sid, g.key);
    }
    return new Set(seen.values());
  }, [groups]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          {language === "id"
            ? "Belum ada catatan kehadiran untuk anak Anda."
            : "No attendance records for your child yet."}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {language === "id"
            ? "Catatan akan muncul ketika guru melakukan check-in/out atau memperbarui kehadiran."
            : "Records appear once a teacher checks in/out or updates attendance."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {students.length > 1 && (
        <div className="max-w-xs">
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "id" ? "Semua Anak" : "All Children"}
              </SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => {
          const duration = formatDuration(g.checkIn?.event_time || undefined, g.checkOut?.event_time || undefined);
          const isLatest = latestKeyByStudent.has(g.key);
          const firstName = g.studentName.split(" ")[0];
          return (
            <div key={g.key} className="rounded-lg border bg-card overflow-hidden">
              {isLatest && g.checkOut && (
                <div className="px-4 py-3 bg-gradient-to-r from-athfal-pink/15 via-athfal-yellow/15 to-athfal-green/15 border-b flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-athfal-pink shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">
                      {language === "id" ? `Sampai jumpa lagi, ${firstName}! 👋` : `See you again, ${firstName}! 👋`}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {language === "id"
                        ? "Terima kasih sudah belajar dan bermain hari ini. Sampai bertemu lagi di kelas berikutnya! 💕"
                        : "Thanks for learning and playing today. See you again in the next class! 💕"}
                    </span>
                  </div>
                </div>
              )}
              {isLatest && g.checkIn && !g.checkOut && (
                <div className="px-4 py-3 bg-gradient-to-r from-athfal-green/15 via-athfal-yellow/15 to-athfal-pink/15 border-b flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-athfal-green shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">
                      {language === "id" ? `Selamat datang, ${firstName}! 🎉` : `Welcome, ${firstName}! 🎉`}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {language === "id"
                        ? "Selamat bermain dan belajar hari ini! ✨"
                        : "Have fun learning and playing today! ✨"}
                    </span>
                  </div>
                </div>
              )}
              {/* Header */}
              <div className="flex items-start justify-between px-4 py-3 border-b bg-accent/40">
                <div>
                  <div className="font-semibold text-base">{g.studentName}</div>
                  {g.programName && (
                    <div className="text-xs text-muted-foreground">{g.programName}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">
                    {format(g.date, "EEE, MMM d, yyyy")}
                  </div>
                  {duration && (
                    <div className="text-xs text-muted-foreground">{duration}</div>
                  )}
                </div>
              </div>

              {/* Photos: IN / OUT */}
              <div className="grid grid-cols-2 gap-2 p-2">
                <PhotoSlot
                  label={language === "id" ? "MASUK" : "IN"}
                  labelClass="text-blue-600 dark:text-blue-400"
                  record={g.checkIn}
                  onZoom={(url, alt) => setLightbox({ url, alt })}
                />
                <PhotoSlot
                  label={language === "id" ? "PULANG" : "OUT"}
                  labelClass="text-red-500 dark:text-red-400"
                  record={g.checkOut}
                  onZoom={(url, alt) => setLightbox({ url, alt })}
                />
              </div>

              {/* Attendance status */}
              {g.attendance?.attendance_status && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {language === "id" ? "Status Kehadiran" : "Attendance Status"}
                    {g.attendance.meeting_number != null && (
                      <> · {language === "id" ? "Pertemuan" : "Session"} {g.attendance.meeting_number || 1}</>
                    )}
                  </span>
                  <Badge className={statusColor(g.attendance.attendance_status)} variant="secondary">
                    {g.attendance.attendance_status.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 border-none">
          {lightbox && (
            <div className="relative">
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={lightbox.url}
                alt={lightbox.alt}
                className="w-full h-auto max-h-[85vh] object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function PhotoSlot({
  label,
  labelClass,
  record,
  onZoom,
}: {
  label: string;
  labelClass: string;
  record?: ChildAttendanceRow;
  onZoom?: (url: string, alt: string) => void;
}) {
  return (
    <div className="rounded-md overflow-hidden bg-muted/40">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {record?.photo_url ? (
          <button
            type="button"
            onClick={() => onZoom?.(record.photo_url!, label)}
            className="w-full h-full block focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Zoom ${label} photo`}
          >
            <img
              src={record.photo_url}
              alt={label}
              className="w-full h-full object-cover cursor-zoom-in"
              loading="lazy"
            />
          </button>
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <div className="px-2 py-2 flex items-center gap-2">
        <span className={`text-xs font-bold ${labelClass}`}>{label}</span>
        <span className="text-sm text-foreground">
          {record?.event_time ? format(new Date(record.event_time), "hh:mm a") : "—"}
        </span>
      </div>
    </div>
  );
}

export default ChildAttendancePanel;