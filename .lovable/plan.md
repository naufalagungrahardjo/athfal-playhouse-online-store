# Fix: teachers can't upload student report photos

## Problem
In the Student Report tab, the "A4 PDF Report" card builds its photo-upload slots only for Page 1 plus report fields that **already have saved final-report text**. When a teacher opens a student who has no final-report text yet, the upload area collapses to almost nothing, so it looks like the section is gone and there is nowhere to upload a photo.

The card itself is not role-restricted (teachers already have full database/storage permission), so the only change needed is to always show an upload slot for every page.

## Changes

### 1. `src/pages/admin/students/StudentReportTab.tsx`
- Pass the full, unfiltered list of report fields to the panel for the purpose of building photo slots, while still passing the text-filtered list for the actual PDF page content.
- Concretely: add a new prop (e.g. `allFields`) containing all 8 `DESCRIPTIVE_FIELDS` (key + label), and keep the existing `fields={pdfFields}` (only fields with saved text) for PDF text pages.

### 2. `src/pages/admin/students/StudentReportPdfPanel.tsx`
- Accept the new `allFields` prop.
- Build `photoPages` from **all** fields: `[Page 1 — Ringkasan, ...allFields]`, so an upload slot always appears for Page 1 and every one of the 8 report fields, regardless of whether text was written.
- When generating the PDF, include a page for a field if it has **either** saved text **or** an uploaded photo (so a photo uploaded to a text-less field still appears in the PDF). Page 1 (summary) keeps showing its photo as today.

## Technical detail
- `photoPages` currently = `[{summary}, ...fields]` where `fields = pdfFields` (filtered to non-empty `content`). Change to use the complete field set for slot rendering.
- `downloadPdf` currently maps `photoPages` into `photosByPage` and passes `fields` (filtered) to `generateStudentReportPdf`. Adjust the field list handed to the generator to be the union of (fields with text) and (fields with an uploaded photo), so empty-text-but-has-photo pages are not dropped. No change to `src/lib/studentReportPdf.ts` signature is required (it already takes `fields` and `photosByPage`).
- No database, RLS, or storage changes — permissions for the `teacher` role are already in place.

## Verification
- Build the project.
- Confirm that opening a student with no final-report text shows photo upload slots for Page 1 and all 8 fields.
- Confirm uploading a photo to a text-less field still embeds it in the generated PDF, and Page 1 photo continues to work.
