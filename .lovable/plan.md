# Security Scan Results & Fix Plan

**Scan date:** 2026-07-15  •  **Total findings:** 118  •  **Severity:** all `warn` (no `critical` / `error`)

Good news first: there are **no critical vulnerabilities**. Passwords are stored bcrypt-hashed by Supabase Auth (not plain text). No RLS-disabled tables, no leaked service keys, no exposed PII endpoints. The findings are mostly hardening warnings.

---

## Finding breakdown

| # | Finding | Count | Priority |
|---|---|---|---|
| 1 | Leaked Password Protection Disabled | 1 | **HIGH** — 1-click fix |
| 2 | Postgres has security patches available | 1 | **HIGH** — 1-click fix |
| 3 | Parent portal access uses fuzzy name matching | 1 | **MEDIUM** — real logic risk |
| 4 | Public storage bucket allows listing | 1 | **MEDIUM** — review |
| 5 | SECURITY DEFINER functions callable by anon | ~40 | **LOW** — mostly intentional |
| 6 | SECURITY DEFINER functions callable by authenticated | ~74 | **LOW** — mostly intentional |

---

## Priority 1 — Do these now (no code required)

These are toggles in the Supabase dashboard, not code changes. I'll give you the exact links after you approve.

- **1a. Enable "Leaked Password Protection"** — blocks passwords found in known breaches (HaveIBeenPwned). Free, one toggle in Auth settings.
- **1b. Upgrade Postgres** — Supabase has security patches waiting. One click in Database → Infrastructure. May cause ~1 min of downtime; do it at a quiet hour.

## Priority 2 — Code / config fix (I'll implement)

- **2. Harden parent-portal access (`can_access_parent_portal`)**
  Today the RPC lets a parent see documents when their `orders.child_name` fuzzy-matches any `students.name`. If two students happen to share a normalized name, one family could see the other's documents.
  **Fix:** rewrite `can_access_parent_portal()` and `list_parent_document_recipients()` to gate access on the real `order_id → student_enrollments` relationship (which already exists via `auto_enroll_order_to_active_programs`), not on name comparison. Migration only — no UI changes.

- **3. Review the `images` bucket listing policy**
  The scanner flags that the `images` bucket policy allows anyone to *list* file paths (not read private content, since files themselves are still individually referenced). We use this bucket for product photos, banners, blog images, AND parent documents / student report photos.
  **Fix:** tighten the `storage.objects` SELECT policy on `images` so listing is admin-only, while individual public files remain reachable by direct URL. I'll audit any code that relies on `storage.list()` first (the `AdminDocuments` bulk-delete flow does).

## Priority 3 — Bulk cleanup (mark as accepted risk)

The ~114 "SECURITY DEFINER function executable" warnings are **by design** for this app. Every one of these functions is a Lovable-standard pattern: RPCs like `validate_promo_code`, `get_order_by_token`, `has_role`, `is_admin_account`, `can_access_student_menu`, `get_my_child_attendance`, etc. They MUST be callable by anon/authenticated to work — that's the whole point of `SECURITY DEFINER` RPCs with internal authorization checks (which yours have).

**Plan:** review the list, then bulk-`ignore` these findings with an explanation in security memory ("SECURITY DEFINER RPCs are the intended pattern; each function performs its own auth check via `auth.email()` / `auth.uid()` / lookup_token"). This stops the noise so future scans surface real issues.

## Extra recommendations (not scanner findings, but worth doing before scaling)

- **Raise auth rate limits sensibly** (`rate_limit_email_sent`) once real signup volume is known — currently at Supabase defaults.
- **Enable MFA (TOTP)** on your super-admin account in Supabase Auth.
- **Rotate the Lovable API key** and any old Supabase keys periodically.
- **Set up Google Search Console + Supabase log alerts** for suspicious login spikes.

---

## Technical execution steps (for the build phase)

1. Migration: rewrite `public.can_access_parent_portal()` to `EXISTS (SELECT 1 FROM orders o JOIN student_enrollments se … JOIN students s ON s.id = se.student_id WHERE lower(o.customer_email)=lower(auth.email()) AND o.status IN ('processing','completed'))` — join on the real enrollment chain, not `normalize_student_program_text` string equality. Same treatment for `list_parent_document_recipients()`.
2. Audit `src/pages/admin/AdminDocuments.tsx` and any hook using `supabase.storage.from('images').list(...)`. Update RLS on `storage.objects` for bucket `images` so SELECT (list) requires `is_admin_account(auth.email())`, but keep public read on individual file paths where needed (product/banner/blog assets already exposed via public URLs).
3. Batch `security--manage_security_finding` with `operation: ignore` for every `SUPA_anon_security_definer_function_executable` and `SUPA_authenticated_security_definer_function_executable` finding, one shared explanation.
4. Call `security--update_memory` to record: (a) parent-portal fix done, (b) SECURITY DEFINER RPC pattern is accepted, (c) `images` bucket listing is admin-only.
5. Tell you to do the two dashboard toggles (Priority 1a, 1b).

Approve this plan and I'll switch to build mode and start with the parent-portal migration.
