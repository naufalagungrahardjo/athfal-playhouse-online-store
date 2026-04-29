
# Storage Capacity Report + Check-In/Out Feature Plan

## Part 1 — Current Supabase Storage Status

Supabase **Free tier** gives you **1 GB of file storage** total (across all buckets).

**Current usage (live query):**
- `images` bucket: **357 files / ~268 MB** (≈ 26.8% used)
- `teacher-evidence` bucket: 0 files / 0 MB
- **Free space remaining: ~756 MB** (≈ 73.2% free)

**How many photos can fit in the remaining ~756 MB?**

| Photo quality (compressed JPEG from phone camera) | Avg size | Photos that fit in 756 MB |
|---|---|---|
| Low (640×480, ~70% quality) — recommended for check-in | ~80 KB | **~9,400 photos** |
| Medium (1280×720) | ~250 KB | **~3,000 photos** |
| High (1920×1080) | ~500 KB | **~1,500 photos** |
| Original phone photo (no compression, 3–5 MB) | ~4 MB | **~190 photos** |

**Recommendation:** compress every photo to ≤ 640×480 / ~80 KB before upload. With ~30 students × 2 photos/day (in + out) × 20 school days = **1,200 photos/month ≈ 96 MB/month** → about **7–8 months of capacity** on free tier with the existing budget.

Alternative: upload to **Google Drive** (the project already has a working `upload-to-drive` edge function with a service account). Free Google Drive gives 15 GB and would last years. Downside: photos live outside the app and are harder to display inline.

---

## Part 2 — Feature Feasibility: YES, fully doable

All required pieces already exist in the project:
- Teacher role + login (`admin_accounts.role = 'teacher'`)
- Student / program / enrollment / attendance tables (`students`, `class_programs`, `student_enrollments`, `student_attendance`)
- A working photo-upload edge function to Google Drive (`upload-to-drive`)
- A private storage bucket (`teacher-evidence`) as a fallback
- Camera capture works in the browser via `<input type="file" accept="image/*" capture="environment">` — no native app needed

---

## Part 3 — Implementation Plan

### A. New database table — `student_checkinout`
Stores every check-in / check-out event with photo evidence, separate from the existing pedagogical `student_attendance` table (so we don't pollute the report card columns).

Columns:
- `id` uuid PK
- `enrollment_id` uuid (FK → `student_enrollments`)
- `program_id` uuid (denormalized for fast filtering)
- `student_id` uuid (denormalized)
- `meeting_number` int (which session of the program)
- `event_type` text — `check_in` | `check_out`
- `event_time` timestamptz default now()
- `photo_url` text (Drive webViewLink OR signed Supabase URL)
- `photo_storage` text — `drive` | `supabase`
- `teacher_email` text
- `created_at`, `updated_at`

RLS:
- Teachers can `INSERT` and `SELECT` their own rows
- Admin / super_admin can `SELECT` all
- Unique index on `(enrollment_id, meeting_number, event_type)` to prevent duplicate check-ins for the same session

### B. Auto-update existing attendance to "present"
DB trigger `after insert on student_checkinout`: when a `check_in` row is inserted, upsert into `student_attendance` for that `(enrollment_id, meeting_number, teacher_email)` setting `attendance_status = 'present'` (preserving descriptive fields if a row already exists).

### C. New page — Teacher Check-In/Out Record
- Route: `/admin/check-in-out` (visible only to `teacher` and `super_admin` in `getAdminNavigation.ts`)
- UI flow on mobile/tablet:
  1. Select **Class (program)** dropdown — only programs the teacher's students are enrolled in
  2. Select **Session #** dropdown
  3. Select **Student** dropdown (filtered by class)
  4. Select **Status** — Check In / Check Out
  5. Tap big **"Open Camera & Submit"** button
  6. Native camera opens (`<input type="file" capture="environment">`)
  7. Photo is **client-side compressed** to 640×480 / ~80 KB (canvas + `toBlob`) before upload
  8. Upload via existing `upload-to-drive` edge function (preferred) — falls back to `teacher-evidence` bucket if no Drive folder configured
  9. Insert row into `student_checkinout` → trigger marks attendance as present
  10. Toast confirmation + show today's recent records below

- Recent records panel: list of today's check-ins/outs with thumbnail, student name, time, status — live-refreshed via React Query.

### D. Admin view (super_admin)
- New tab inside `AdminStudents` called **"Check-In/Out Log"** with:
  - Filter by date range, class, student
  - Table: date, student, class, event type, time, photo (click to open), teacher
  - Export to CSV

### E. Edge function
Reuse the existing `upload-to-drive` function as-is. No new function needed. Uploaded files go into the teacher's pre-configured Drive folder.

### F. Storage strategy choice (recommend asking user)
Default to **Google Drive** for photo storage (essentially unlimited for this use case) and keep `teacher-evidence` Supabase bucket as automatic fallback. This matches the existing teacher-evidence flow.

---

## Part 4 — What you need to do

1. Approve this plan.
2. Confirm storage choice: **Google Drive (recommended)** vs **Supabase only** vs **let teachers' Drive folder decide (current pattern)**.
3. Confirm whether check-out should also auto-update anything (e.g. record `leave_time`) or just be logged.

After approval I will:
- Create the migration (table + RLS + trigger + indexes)
- Build the new `/admin/check-in-out` page with camera capture + client-side compression
- Add the admin log tab
- Wire navigation/role permissions
