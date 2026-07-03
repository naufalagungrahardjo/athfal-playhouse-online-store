import jsPDF from "jspdf";

// Athfal brand colors (RGB)
const BRAND = {
  pink: [211, 138, 130] as [number, number, number],
  peach: [238, 205, 196] as [number, number, number],
  lightPeach: [250, 240, 235] as [number, number, number],
  green: [109, 123, 107] as [number, number, number],
  teal: [159, 185, 187] as [number, number, number],
  yellow: [233, 200, 115] as [number, number, number],
  text: [60, 60, 60] as [number, number, number],
  muted: [130, 130, 130] as [number, number, number],
};

export type ProgramSummaryRow = {
  programName: string;
  period: string;
  present: number;
  absent: number;
  sick_leave: number;
  other_leave: number;
};

export type ReportFieldPage = {
  key: string;
  label: string;
  content: string;
};

export interface StudentReportPdfInput {
  studentName: string;
  generatedDate: string; // ISO
  summary: ProgramSummaryRow[];
  fields: ReportFieldPage[];
  /** Full-page background theme image (data URL). */
  themeDataUrl?: string | null;
  /** Full-page custom cover image (data URL). When set, it fully replaces the default cover design. */
  coverDataUrl?: string | null;
  /** Class / program name shown on the default cover page. */
  className?: string;
  /** Map of page key -> student photo (data URL). Page 1 uses key "summary". */
  photosByPage: Record<string, string | null | undefined>;
  businessName?: string;
  logoDataUrl?: string | null;
  /** Opacity of the white reading panel behind content (0 = fully transparent, 1 = solid white). Default 0.9. */
  cardOpacity?: number;
}

const detectFormat = (dataUrl: string): "PNG" | "JPEG" => {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  return "PNG";
};

// Measure the natural pixel dimensions of an image data URL so photos can be
// drawn with their real aspect ratio (contain-fit) instead of being stretched.
const measureImage = (dataUrl: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = dataUrl;
    } catch {
      resolve({ w: 1, h: 1 });
    }
  });

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d;
  }
};

export const generateStudentReportPdf = async (input: StudentReportPdfInput) => {
  const {
    studentName,
    generatedDate,
    summary,
    fields,
    themeDataUrl,
    coverDataUrl,
    className,
    photosByPage,
    businessName = "Athfal Playhouse",
    logoDataUrl,
    cardOpacity = 0.9,
  } = input;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const cardInset = 22;

  // Pre-measure every photo's natural dimensions so we can draw them with the
  // correct aspect ratio (contain-fit) inside their frames.
  const photoDims: Record<string, { w: number; h: number }> = {};
  await Promise.all(
    Object.entries(photosByPage).map(async ([key, url]) => {
      if (url) photoDims[key] = await measureImage(url);
    })
  );

  // Measure the logo so it can be drawn with its real aspect ratio (contain-fit)
  // instead of being squashed into a square.
  const logoDims = logoDataUrl ? await measureImage(logoDataUrl) : null;

  // Draws the full-page theme background + a translucent white reading panel.
  const paintBackground = () => {
    if (themeDataUrl) {
      try {
        doc.addImage(themeDataUrl, detectFormat(themeDataUrl), 0, 0, pageW, pageH, undefined, "FAST");
      } catch { /* noop */ }
    } else {
      // Soft default kid-friendly gradient-ish fill
      doc.setFillColor(...BRAND.lightPeach);
      doc.rect(0, 0, pageW, pageH, "F");
    }
    // Translucent white card so text stays legible over any theme.
    // Skip entirely when opacity is 0 so the uploaded design shows through fully.
    if (cardOpacity > 0) {
      try {
        // @ts-ignore - GState exists at runtime in jsPDF
        doc.setGState(new (doc as any).GState({ opacity: Math.min(1, cardOpacity) }));
      } catch { /* noop */ }
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cardInset, cardInset, pageW - cardInset * 2, pageH - cardInset * 2, 14, 14, "F");
      try {
        // @ts-ignore
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
      } catch { /* noop */ }
    }
    // Decorative top band inside the card
    doc.setFillColor(...BRAND.peach);
    doc.roundedRect(cardInset, cardInset, pageW - cardInset * 2, 10, 14, 14, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(cardInset, cardInset + 8, pageW - cardInset * 2, 6, "F");
  };

  // Draws a framed student photo box. The photo is scaled to fit inside the
  // frame while preserving its aspect ratio (contain-fit) and centered, so it
  // is never stretched. Returns the bottom Y of the frame.
  const drawPhoto = (
    photo: string | null | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    dims?: { w: number; h: number }
  ) => {
    // Frame
    doc.setFillColor(...BRAND.lightPeach);
    doc.setDrawColor(...BRAND.pink);
    doc.setLineWidth(1.5);
    doc.roundedRect(x, y, w, h, 8, 8, "FD");
    if (photo) {
      try {
        const pad = 5;
        const boxW = w - pad * 2;
        const boxH = h - pad * 2;
        const nat = dims && dims.w > 0 && dims.h > 0 ? dims : { w: boxW, h: boxH };
        // Contain-fit: scale so the whole image fits, keeping aspect ratio.
        const scale = Math.min(boxW / nat.w, boxH / nat.h);
        const drawW = nat.w * scale;
        const drawH = nat.h * scale;
        const dx = x + pad + (boxW - drawW) / 2;
        const dy = y + pad + (boxH - drawH) / 2;
        doc.addImage(photo, detectFormat(photo), dx, dy, drawW, drawH, undefined, "FAST");
      } catch {
        throw new Error("Student photo could not be added to the PDF. Please re-upload the photo and try again.");
      }
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text("Foto Siswa", x + w / 2, y + h / 2, { align: "center" });
    }
    return y + h;
  };

  const contentLeft = cardInset + 24;
  const contentRight = pageW - cardInset - 24;
  const contentWidth = contentRight - contentLeft;

  // ============ COVER PAGE ============
  // If a custom cover image is uploaded, it fully replaces the default design.
  const drawCoverPage = () => {
    if (coverDataUrl) {
      try {
        doc.addImage(coverDataUrl, detectFormat(coverDataUrl), 0, 0, pageW, pageH, undefined, "FAST");
        return;
      } catch { /* fall through to default cover */ }
    }

    // --- Default kid-friendly, faceless cover ---
    // Soft sky background
    doc.setFillColor(...BRAND.lightPeach);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(210, 231, 233); // pale sky
    doc.rect(0, 0, pageW, pageH * 0.62, "F");

    // Fluffy clouds (faceless, just overlapping circles)
    const cloud = (cx: number, cy: number, s: number) => {
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy, 16 * s, "F");
      doc.circle(cx + 20 * s, cy + 4 * s, 20 * s, "F");
      doc.circle(cx + 45 * s, cy, 15 * s, "F");
      doc.rect(cx, cy, 45 * s, 14 * s, "F");
    };
    cloud(pageW * 0.12, pageH * 0.12, 1.1);
    cloud(pageW * 0.62, pageH * 0.08, 0.9);
    cloud(pageW * 0.72, pageH * 0.24, 1.3);

    // Sun (faceless)
    doc.setFillColor(...BRAND.yellow);
    doc.circle(pageW * 0.85, pageH * 0.14, 26, "F");

    // Scattered stars
    const star = (cx: number, cy: number, r: number, col: [number, number, number]) => {
      doc.setFillColor(...col);
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const a2 = a + Math.PI / 5;
        doc.triangle(
          cx, cy,
          cx + Math.cos(a) * r, cy + Math.sin(a) * r,
          cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45,
          "F"
        );
      }
    };
    star(pageW * 0.2, pageH * 0.32, 10, BRAND.yellow);
    star(pageW * 0.9, pageH * 0.4, 8, BRAND.pink);
    star(pageW * 0.08, pageH * 0.5, 7, BRAND.teal);

    // Rolling grass hills at the bottom
    doc.setFillColor(...BRAND.teal);
    doc.roundedRect(-40, pageH * 0.66, pageW * 0.7, pageH, 120, 120, "F");
    doc.setFillColor(...BRAND.green);
    doc.roundedRect(pageW * 0.35, pageH * 0.72, pageW * 0.8, pageH, 140, 140, "F");

    // Faceless kid balloons (round heads, triangle bodies — no faces)
    const kid = (cx: number, baseY: number, bodyCol: [number, number, number], skin: [number, number, number]) => {
      // body
      doc.setFillColor(...bodyCol);
      doc.triangle(cx, baseY - 46, cx - 22, baseY, cx + 22, baseY, "F");
      // head
      doc.setFillColor(...skin);
      doc.circle(cx, baseY - 56, 15, "F");
    };
    kid(pageW * 0.28, pageH * 0.9, BRAND.pink, [244, 214, 190]);
    kid(pageW * 0.7, pageH * 0.93, BRAND.yellow, [232, 200, 170]);

    // Central title card
    const cardW = pageW - 120;
    const cardX = 60;
    const cardY = pageH * 0.34;
    const cardH = 210;
    try {
      // @ts-ignore - GState exists at runtime
      doc.setGState(new (doc as any).GState({ opacity: 0.92 }));
    } catch { /* noop */ }
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardW, cardH, 20, 20, "F");
    try {
      // @ts-ignore
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    } catch { /* noop */ }
    // top accent band
    doc.setFillColor(...BRAND.pink);
    doc.roundedRect(cardX, cardY, cardW, 12, 20, 20, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(cardX, cardY + 8, cardW, 8, "F");

    const cxCenter = pageW / 2;
    let cy = cardY + 56;

    // Logo
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, detectFormat(logoDataUrl), cxCenter - 20, cardY + 18, 40, 40);
        cy = cardY + 74;
      } catch { /* noop */ }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.setTextColor(...BRAND.pink);
    doc.text("STUDENT REPORT", cxCenter, cy, { align: "center" });
    cy += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.green);
    doc.text("Laporan Perkembangan Siswa", cxCenter, cy, { align: "center" });
    cy += 34;

    // Class name pill
    if (className) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const label = className;
      const pillW = Math.min(cardW - 60, doc.getTextWidth(label) + 44);
      doc.setFillColor(...BRAND.peach);
      doc.roundedRect(cxCenter - pillW / 2, cy - 15, pillW, 26, 13, 13, "F");
      doc.setTextColor(...BRAND.text);
      doc.text(label, cxCenter, cy + 3, { align: "center" });
      cy += 40;
    }

    // Student name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...BRAND.green);
    doc.text(studentName, cxCenter, cy, { align: "center" });

    // Date + business at the very bottom
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${businessName} — ${formatDate(generatedDate)}`, cxCenter, pageH - 30, { align: "center" });
  };

  drawCoverPage();
  doc.addPage();

  // ============ PAGE 1 — Attendance Summary ============
  paintBackground();
  let y = cardInset + 40;

  // Logo + business name
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, detectFormat(logoDataUrl), contentLeft, y, 40, 40);
    } catch { /* noop */ }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND.green);
  doc.text(businessName, contentLeft + (logoDataUrl ? 52 : 0), y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("Laporan Perkembangan Siswa", contentLeft + (logoDataUrl ? 52 : 0), y + 33);
  y += 60;

  // Photo (top-right)
  const photoW = 110;
  const photoH = 130;
  drawPhoto(photosByPage["summary"], contentRight - photoW, y, photoW, photoH, photoDims["summary"]);

  // Student name + date (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.pink);
  doc.text(studentName, contentLeft, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  doc.text(`Tanggal Laporan: ${formatDate(generatedDate)}`, contentLeft, y + 46);

  y += photoH + 30;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.green);
  doc.text("Ringkasan Kehadiran", contentLeft, y);
  y += 14;

  // Attendance table
  const cols = [
    { key: "programName", label: "Program", w: contentWidth * 0.34 },
    { key: "period", label: "Periode", w: contentWidth * 0.30 },
    { key: "present", label: "Hadir", w: contentWidth * 0.09 },
    { key: "absent", label: "Absen", w: contentWidth * 0.09 },
    { key: "sick_leave", label: "Sakit", w: contentWidth * 0.09 },
    { key: "other_leave", label: "Izin", w: contentWidth * 0.09 },
  ];
  const rowH = 22;
  // Header
  doc.setFillColor(...BRAND.green);
  doc.roundedRect(contentLeft, y, contentWidth, rowH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  let cx = contentLeft + 6;
  cols.forEach((c) => {
    const center = ["present", "absent", "sick_leave", "other_leave"].includes(c.key);
    doc.text(c.label, center ? cx + c.w / 2 - 6 : cx, y + 15, { align: center ? "center" : "left" });
    cx += c.w;
  });
  y += rowH;

  // Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.text);
  const rows = summary.length ? summary : [{ programName: "—", period: "—", present: 0, absent: 0, sick_leave: 0, other_leave: 0 }];
  rows.forEach((r, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(...BRAND.lightPeach);
      doc.rect(contentLeft, y, contentWidth, rowH, "F");
    }
    cx = contentLeft + 6;
    cols.forEach((c) => {
      const raw = (r as any)[c.key];
      const val = raw === undefined || raw === null ? "" : String(raw);
      const center = ["present", "absent", "sick_leave", "other_leave"].includes(c.key);
      doc.setFontSize(8.5);
      const text = c.key === "programName" || c.key === "period"
        ? doc.splitTextToSize(val, c.w - 8)[0] || val
        : val;
      doc.text(text, center ? cx + c.w / 2 - 6 : cx, y + 14, { align: center ? "center" : "left" });
      cx += c.w;
    });
    y += rowH;
  });

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      present: acc.present + (r.present || 0),
      absent: acc.absent + (r.absent || 0),
      sick_leave: acc.sick_leave + (r.sick_leave || 0),
      other_leave: acc.other_leave + (r.other_leave || 0),
    }),
    { present: 0, absent: 0, sick_leave: 0, other_leave: 0 }
  );
  doc.setFillColor(...BRAND.peach);
  doc.rect(contentLeft, y, contentWidth, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.text);
  cx = contentLeft + 6;
  doc.text("Total", cx, y + 14);
  cx += cols[0].w + cols[1].w;
  (["present", "absent", "sick_leave", "other_leave"] as const).forEach((k, idx) => {
    const c = cols[2 + idx];
    doc.text(String((totals as any)[k]), cx + c.w / 2 - 6, y + 14, { align: "center" });
    cx += c.w;
  });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`${businessName} — athfalplayhouse.com`, pageW / 2, pageH - cardInset - 10, { align: "center" });

  // ============ FIELD PAGES (two report fields per page) ============
  // Draws a single report field (title bar + photo on the left + justified
  // paragraph on the right) inside a vertical segment.
  const drawFieldSegment = (field: ReportFieldPage, segTop: number, segHeight: number) => {
    let sy = segTop;

    // Field title bar
    const titleH = 30;
    doc.setFillColor(...BRAND.pink);
    doc.roundedRect(contentLeft, sy, contentWidth, titleH, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(field.label, contentLeft + 14, sy + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(studentName, contentRight - 14, sy + 20, { align: "right" });
    sy += titleH + 16;

    // Photo (left) + paragraph (right, justified)
    const fpW = 120;
    const fpH = 150;
    drawPhoto(photosByPage[field.key], contentLeft, sy, fpW, fpH, photoDims[field.key]);

    const textX = contentLeft + fpW + 18;
    const textW = contentRight - textX;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    const lines: string[] = doc.splitTextToSize(field.content || "—", textW);
    const lineH = 14;
    // Text may run taller than the photo; clamp to the segment's usable height.
    const availTextH = segTop + segHeight - sy;
    const maxLines = Math.max(0, Math.floor(availTextH / lineH));
    const shown = lines.slice(0, maxLines);
    let ty = sy + 10;
    const spaceW = doc.getTextWidth(" ");
    shown.forEach((ln, i) => {
      const isLast = i === shown.length - 1;
      const words = ln.split(" ").filter((w) => w.length > 0);
      // Manually justify: distribute the leftover width evenly between words.
      // The last line (and single-word lines) stay left-aligned.
      if (!isLast && words.length > 1) {
        const wordsW = words.reduce((s, w) => s + doc.getTextWidth(w), 0);
        const gap = (textW - wordsW) / (words.length - 1);
        // Guard against overly wide gaps from anomalous short lines.
        if (gap > 0 && gap < spaceW * 6) {
          let wx = textX;
          words.forEach((w) => {
            doc.text(w, wx, ty);
            wx += doc.getTextWidth(w) + gap;
          });
        } else {
          doc.text(ln, textX, ty);
        }
      } else {
        doc.text(ln, textX, ty);
      }
      ty += lineH;
    });
  };

  const drawPageFooter = () => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(`${businessName} — athfalplayhouse.com`, pageW / 2, pageH - cardInset - 10, { align: "center" });
  };

  // Group fields into pairs (top + bottom segment per page).
  const regionTop = cardInset + 36;
  const regionBottom = pageH - cardInset - 26;
  const regionGap = 18;
  const segH = (regionBottom - regionTop - regionGap) / 2;

  for (let i = 0; i < fields.length; i += 2) {
    doc.addPage();
    paintBackground();
    drawFieldSegment(fields[i], regionTop, segH);
    if (fields[i + 1]) {
      // Divider between the two segments.
      doc.setDrawColor(...BRAND.peach);
      doc.setLineWidth(1);
      const midY = regionTop + segH + regionGap / 2;
      doc.line(contentLeft, midY, contentRight, midY);
      drawFieldSegment(fields[i + 1], regionTop + segH + regionGap, segH);
    }
    drawPageFooter();
  }

  doc.save(`Laporan_${studentName.replace(/\s+/g, "_")}.pdf`);
};
