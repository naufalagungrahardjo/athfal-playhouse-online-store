import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

type RGB = [number, number, number];

const BRAND: Record<string, RGB> = {
  pink: [211, 138, 130],
  peach: [238, 205, 196],
  lightPeach: [250, 240, 235],
  green: [109, 123, 107],
  text: [60, 60, 60],
  muted: [130, 130, 130],
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta" });
  } catch {
    return d;
  }
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

// Fetch an image, downscale it, and flatten onto white -> small JPEG data URL.
// This keeps the PDF small (raw full-res images bloat jsPDF output massively).
const fetchImage = async (
  url: string,
  maxSize = 600,
): Promise<{ dataUrl: string; fmt: "JPEG" } | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const decoded = await Image.decode(bytes);
    const ratio = Math.min(1, maxSize / Math.max(decoded.width, decoded.height));
    const w = Math.max(1, Math.round(decoded.width * ratio));
    const h = Math.max(1, Math.round(decoded.height * ratio));
    if (ratio < 1) decoded.resize(w, h);
    // Flatten onto white background (handles PNG transparency).
    const canvas = new Image(decoded.width, decoded.height).fill(0xffffffff);
    canvas.composite(decoded, 0, 0);
    const jpeg = await canvas.encodeJPEG(85);
    return { dataUrl: `data:image/jpeg;base64,${toBase64(jpeg)}`, fmt: "JPEG" };
  } catch {
    return null;
  }
};

export interface BillingPdfInput {
  notice: { title: string; amount: number; due_date: string; description?: string | null };
  order: { id: string; customer_name: string; customer_email: string; customer_phone?: string | null; customer_address?: string | null };
  paymentMethods: Array<{ bank_name: string; account_name: string; account_number: string; image: string | null; payment_steps: unknown }>;
  logoUrl: string;
  businessName?: string;
}

export const generateBillingNoticePdfBase64 = async ({
  notice,
  order,
  paymentMethods,
  logoUrl,
  businessName = "Athfal Playhouse",
}: BillingPdfInput): Promise<string> => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const logo = await fetchImage(logoUrl);

  // Top band
  doc.setFillColor(...BRAND.peach);
  doc.rect(0, 0, pageWidth, 8, "F");

  const logoH = 56, logoW = 56;
  if (logo) {
    try { doc.addImage(logo.dataUrl, logo.fmt, margin, y, logoW, logoH); } catch { /* noop */ }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.green);
  doc.text(businessName, margin + logoW + 14, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("athfalplayhouse.com", margin + logoW + 14, y + 44);

  y += logoH + 24;

  // Title bar
  doc.setFillColor(...BRAND.pink);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 44, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("BILLING NOTICE", margin + 18, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Issued: ${formatDate(new Date().toISOString())}`, pageWidth - margin - 18, y + 20, { align: "right" });
  doc.text(`Due: ${formatDate(notice.due_date)}`, pageWidth - margin - 18, y + 34, { align: "right" });

  y += 44 + 24;

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.green);
  doc.text("Bill To", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  doc.text(order.customer_name || "-", margin, y);
  if (order.customer_email) { y += 14; doc.text(order.customer_email, margin, y); }
  if (order.customer_phone) { y += 14; doc.text(order.customer_phone, margin, y); }
  if (order.customer_address) {
    y += 14;
    const lines = doc.splitTextToSize(order.customer_address, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += (lines.length - 1) * 12;
  }
  y += 14;
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Order Reference: ${order.id}`, margin, y);

  // Notice box
  y += 24;
  doc.setDrawColor(...BRAND.peach);
  doc.setFillColor(...BRAND.lightPeach);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 80, 10, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.green);
  const titleLines = doc.splitTextToSize(notice.title, pageWidth - margin * 2 - 200);
  doc.text(titleLines, margin + 18, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Due ${formatDate(notice.due_date)}`, margin + 18, y + 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.pink);
  doc.text(formatIDR(notice.amount), pageWidth - margin - 18, y + 46, { align: "right" });

  y += 80 + 22;

  // Description
  if (notice.description && notice.description.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.green);
    doc.text("Details", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    const descLines = doc.splitTextToSize(notice.description, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 13;
  }

  // Total
  y += 16;
  doc.setDrawColor(...BRAND.peach);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.green);
  doc.text("Amount Due", margin, y);
  doc.setTextColor(...BRAND.pink);
  doc.text(formatIDR(notice.amount), pageWidth - margin, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("Thank you. Please complete your payment by the due date above.", pageWidth / 2, pageHeight - 32, { align: "center" });
  doc.setFillColor(...BRAND.peach);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  // ===== How to Pay =====
  if (paymentMethods.length > 0) {
    const drawChrome = (title: string) => {
      doc.setFillColor(...BRAND.peach);
      doc.rect(0, 0, pageWidth, 8, "F");
      doc.setFillColor(...BRAND.peach);
      doc.rect(0, pageHeight - 8, pageWidth, 8, "F");
      if (logo) { try { doc.addImage(logo.dataUrl, logo.fmt, margin, margin - 8, 32, 32); } catch { /* noop */ } }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND.green);
      doc.text(businessName, margin + 40, margin + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...BRAND.pink);
      doc.text(title, pageWidth - margin, margin + 12, { align: "right" });
    };
    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 48) { doc.addPage(); drawChrome("How to Pay"); y = margin + 56; }
    };

    doc.addPage();
    drawChrome("How to Pay");
    y = margin + 56;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    const intro = `Total Amount: ${formatIDR(notice.amount)}. Please use one of the payment methods below and follow the steps to complete your payment.`;
    const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
    doc.text(introLines, margin, y);
    y += introLines.length * 13 + 12;

    for (let i = 0; i < paymentMethods.length; i++) {
      const pm = paymentMethods[i];
      ensureSpace(80);
      doc.setFillColor(...BRAND.green);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Option ${i + 1}: ${pm.bank_name}`, margin + 14, y + 18);
      y += 28 + 12;

      const boxH = 90;
      ensureSpace(boxH + 8);
      doc.setDrawColor(...BRAND.peach);
      doc.setFillColor(...BRAND.lightPeach);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 8, 8, "FD");

      const imgBoxW = 90, imgBoxH = 70;
      let imgDrawn = false;
      if (pm.image) {
        const img = await fetchImage(pm.image);
        if (img) {
          try {
            const props = doc.getImageProperties(img.dataUrl);
            const ratio = Math.min(imgBoxW / props.width, imgBoxH / props.height);
            const drawW = props.width * ratio;
            const drawH = props.height * ratio;
            const drawX = pageWidth - margin - 14 - imgBoxW + (imgBoxW - drawW) / 2;
            const drawY = y + 10 + (imgBoxH - drawH) / 2;
            doc.addImage(img.dataUrl, img.fmt, drawX, drawY, drawW, drawH);
            imgDrawn = true;
          } catch { /* noop */ }
        }
      }

      const textRight = imgDrawn ? pageWidth - margin - imgBoxW - 28 : pageWidth - margin - 14;
      const textW = textRight - (margin + 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.green);
      doc.text("Account Number", margin + 14, y + 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BRAND.pink);
      doc.text(doc.splitTextToSize(pm.account_number, textW), margin + 14, y + 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.green);
      doc.text("Account Name", margin + 14, y + 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.text);
      doc.text(doc.splitTextToSize(pm.account_name, textW), margin + 14, y + 75);

      y += boxH + 14;

      const steps: string[] = Array.isArray(pm.payment_steps)
        ? (pm.payment_steps as unknown[]).map((s) => {
            const raw = typeof s === "string" ? s : ((s as Record<string, unknown>)?.id || (s as Record<string, unknown>)?.en || "");
            return String(raw)
              .replace(/account number/gi, pm.account_number)
              .replace(/nomor rekening/gi, pm.account_number)
              .replace(/transfer amount/gi, formatIDR(notice.amount))
              .replace(/jumlah transfer/gi, formatIDR(notice.amount));
          })
        : [];

      if (steps.length > 0) {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...BRAND.green);
        doc.text("Payment Steps", margin, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...BRAND.text);
        steps.forEach((step, idx) => {
          const lines = doc.splitTextToSize(`${idx + 1}. ${step}`, pageWidth - margin * 2 - 8);
          ensureSpace(lines.length * 13 + 4);
          doc.text(lines, margin + 4, y);
          y += lines.length * 13 + 2;
        });
      }

      y += 14;
      if (i < paymentMethods.length - 1) {
        ensureSpace(20);
        doc.setDrawColor(...BRAND.peach);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;
      }
    }

    ensureSpace(60);
    doc.setFillColor(...BRAND.peach);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.green);
    doc.text("After Payment", margin + 14, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.text);
    const confirmLines = doc.splitTextToSize("Please send your payment proof via WhatsApp so we can confirm your payment as soon as possible.", pageWidth - margin * 2 - 28);
    doc.text(confirmLines, margin + 14, y + 36);
  }

  // Return base64 (no data-uri prefix)
  return doc.output("datauristring").split(",")[1];
};
