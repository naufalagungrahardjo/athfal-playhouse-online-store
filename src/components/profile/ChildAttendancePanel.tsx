import { useMemo, useState } from "react";
import { useChildAttendance, ChildAttendanceRow } from "@/hooks/useChildAttendance";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, ImageIcon } from "lucide-react";
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
          return (
            <div key={g.key} className="rounded-lg border bg-card overflow-hidden">
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
                />
                <PhotoSlot
                  label={language === "id" ? "PULANG" : "OUT"}
                  labelClass="text-red-500 dark:text-red-400"
                  record={g.checkOut}
                />
              </div>

              {/* Attendance status */}
              {g.attendance?.attendance_status && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {language === "id" ? "Status Kehadiran" : "Attendance Status"}
                    {g.attendance.meeting_number != null && (
                      <> · {language === "id" ? "Pertemuan" : "Session"} {g.attendance.meeting_number}</>
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
    </div>
  );
};

function PhotoSlot({
  label,
  labelClass,
  record,
}: {
  label: string;
  labelClass: string;
  record?: ChildAttendanceRow;
}) {
  return (
    <div className="rounded-md overflow-hidden bg-muted/40">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {record?.photo_url ? (
          <img
            src={record.photo_url}
            alt={label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
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