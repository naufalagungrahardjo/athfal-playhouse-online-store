import jsPDF from "jspdf";
import { formatCurrency } from "./utils";
import { supabase } from "@/integrations/supabase/client";

export interface BillingNoticePdfInput {
  notice: {
    title: string;
    amount: number;
    due_date: string;
    description?: string | null;
  };
  order: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string | null;
    customer_address?: string | null;
  };
  business?: {
    name?: string;
    addressLines?: string[];
    contact?: string;
  };
}

const DEFAULT_BUSINESS = {
  name: "Athfal Playhouse",
  addressLines: ["athfalplayhouse.com"],
  contact: "",
};

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

const LOGO_URL = "/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png";

const fetchAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const detectImageFormat = (dataUrl: string): "PNG" | "JPEG" => {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  return "PNG";
};

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

export const generateBillingNoticePdf = async ({
  notice,
  order,
  business = DEFAULT_BUSINESS,
}: BillingNoticePdfInput) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Pre-fetch logo and payment methods in parallel
  const [logoDataUrl, paymentMethodsRes] = await Promise.all([
    fetchAsDataUrl(LOGO_URL),
    supabase
      .from("payment_methods")
      .select("bank_name, account_name, account_number, image, payment_steps")
      .eq("active", true)
      .order("bank_name"),
  ]);
  const paymentMethods = (paymentMethodsRes.data || []) as Array<{
    bank_name: string;
    account_name: string;
    account_number: string;
    image: string | null;
    payment_steps: any;
  }>;

  // ======== PAGE 1 — Branded Billing Notice ========
  // Top color band
  doc.setFillColor(...BRAND.peach);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Logo (top-left)
  const logoH = 56;
  const logoW = 56;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, detectImageFormat(logoDataUrl), margin, y, logoW, logoH);
    } catch { /* noop */ }
  }
  // Brand name beside logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.green);
  doc.text(business.name || DEFAULT_BUSINESS.name!, margin + logoW + 14, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  (business.addressLines || []).forEach((line, i) => {
    doc.text(line, margin + logoW + 14, y + 44 + i * 12);
  });

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

  // Notice details box
  y += 24;
  doc.setDrawColor(...BRAND.peach);
  doc.setFillColor(...BRAND.lightPeach);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 80, 10, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.green);
  doc.text(notice.title, margin + 18, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Due ${formatDate(notice.due_date)}`, margin + 18, y + 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND.pink);
  doc.text(formatCurrency(notice.amount), pageWidth - margin - 18, y + 42, { align: "right" });

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
  doc.text(formatCurrency(notice.amount), pageWidth - margin, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "Thank you. Please complete your payment by the due date above.",
    pageWidth / 2,
    pageHeight - 32,
    { align: "center" }
  );
  doc.setFillColor(...BRAND.peach);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  // ======== PAGE 2+ — How to Pay ========
  if (paymentMethods.length > 0) {
    const drawPageChrome = (title: string) => {
      doc.setFillColor(...BRAND.peach);
      doc.rect(0, 0, pageWidth, 8, "F");
      doc.setFillColor(...BRAND.peach);
      doc.rect(0, pageHeight - 8, pageWidth, 8, "F");
      // Mini header with logo
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, detectImageFormat(logoDataUrl), margin, margin - 8, 32, 32); } catch { /* noop */ }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND.green);
      doc.text(business.name || DEFAULT_BUSINESS.name!, margin + 40, margin + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...BRAND.pink);
      doc.text(title, pageWidth - margin, margin + 12, { align: "right" });
    };

    const ensureSpace = (needed: number, title: string) => {
      if (y + needed > pageHeight - 48) {
        doc.addPage();
        drawPageChrome(title);
        y = margin + 56;
      }
    };

    doc.addPage();
    drawPageChrome("How to Pay");
    y = margin + 56;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    const intro = `Total Amount: ${formatCurrency(notice.amount)}. Please use one of the payment methods below and follow the steps to complete your payment.`;
    const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
    doc.text(introLines, margin, y);
    y += introLines.length * 13 + 12;

    for (let i = 0; i < paymentMethods.length; i++) {
      const pm = paymentMethods[i];
      ensureSpace(80, "How to Pay");

      // Method header pill
      doc.setFillColor(...BRAND.green);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Option ${i + 1}: ${pm.bank_name}`, margin + 14, y + 18);
      y += 28 + 12;

      // Account info box (left) + image (right)
      const boxH = 90;
      ensureSpace(boxH + 8, "How to Pay");
      doc.setDrawColor(...BRAND.peach);
      doc.setFillColor(...BRAND.lightPeach);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxH, 8, 8, "FD");

      const imgBoxW = 90;
      const imgBoxH = 70;
      let imgDrawn = false;
      if (pm.image) {
        const imgData = await fetchAsDataUrl(pm.image);
        if (imgData) {
          try {
            doc.addImage(
              imgData,
              detectImageFormat(imgData),
              pageWidth - margin - 14 - imgBoxW,
              y + 10,
              imgBoxW,
              imgBoxH
            );
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
      const accLines = doc.splitTextToSize(pm.account_number, textW);
      doc.text(accLines, margin + 14, y + 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.green);
      doc.text("Account Name", margin + 14, y + 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.text);
      const nameLines = doc.splitTextToSize(pm.account_name, textW);
      doc.text(nameLines, margin + 14, y + 75);

      y += boxH + 14;

      // Steps
      const steps: string[] = Array.isArray(pm.payment_steps)
        ? pm.payment_steps.map((s: any) => {
            const raw = typeof s === "string" ? s : (s?.id || s?.en || "");
            return String(raw)
              .replace(/account number/gi, pm.account_number)
              .replace(/nomor rekening/gi, pm.account_number)
              .replace(/transfer amount/gi, formatCurrency(notice.amount))
              .replace(/jumlah transfer/gi, formatCurrency(notice.amount));
          })
        : [];

      if (steps.length > 0) {
        ensureSpace(40, "How to Pay");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...BRAND.green);
        doc.text("Payment Steps", margin, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...BRAND.text);
        steps.forEach((step, idx) => {
          const prefix = `${idx + 1}. `;
          const lines = doc.splitTextToSize(prefix + step, pageWidth - margin * 2 - 8);
          ensureSpace(lines.length * 13 + 4, "How to Pay");
          doc.text(lines, margin + 4, y);
          y += lines.length * 13 + 2;
        });
      }

      y += 14;
      if (i < paymentMethods.length - 1) {
        ensureSpace(20, "How to Pay");
        doc.setDrawColor(...BRAND.peach);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;
      }
    }

    // Confirmation note
    ensureSpace(60, "How to Pay");
    doc.setFillColor(...BRAND.peach);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.green);
    doc.text("After Payment", margin + 14, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.text);
    const confirmText = "Please send your payment proof via WhatsApp so we can confirm your payment as soon as possible.";
    const confirmLines = doc.splitTextToSize(confirmText, pageWidth - margin * 2 - 28);
    doc.text(confirmLines, margin + 14, y + 36);
  }

  const safeName = (order.customer_name || "customer").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_");
  const safeTitle = (notice.title || "billing-notice").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "_");
  const filename = `${safeTitle}_${safeName}.pdf`;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  // In-app webviews (Lovable app, Instagram, FB, LINE, etc.) often block
  // blob downloads and popups. Detect and use data-URL navigation instead.
  const isInAppWebview = /(Instagram|FBAN|FBAV|Line|Lovable|wv\)|; wv)/i.test(ua);

  try {
    if (isInAppWebview) {
      // Most reliable inside webviews: navigate the current view to a data URL.
      const dataUri = doc.output("datauristring");
      window.location.href = dataUri;
      return;
    }

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    if (isMobile) {
      // Try opening in a new tab first — mobile browsers can then save/share.
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blocked — fall back to navigating the current tab.
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    try { doc.save(filename); } catch { /* noop */ }
  }
};