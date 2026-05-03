import jsPDF from "jspdf";
import { formatCurrency } from "./utils";

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

export const generateBillingNoticePdf = ({
  notice,
  order,
  business = DEFAULT_BUSINESS,
}: BillingNoticePdfInput) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(business.name || DEFAULT_BUSINESS.name!, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  (business.addressLines || []).forEach((line) => {
    y += 14;
    doc.text(line, margin, y);
  });

  // Title block
  y += 36;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BILLING NOTICE", margin, y);

  // Right side: due date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Issued: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y - 14, { align: "right" });
  doc.text(`Due Date: ${formatDate(notice.due_date)}`, pageWidth - margin, y, { align: "right" });

  // Bill To
  y += 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
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
  doc.setTextColor(120);
  doc.text(`Order Reference: ${order.id}`, margin, y);
  doc.setTextColor(0);

  // Notice details box
  y += 28;
  doc.setDrawColor(220);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 70, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(notice.title, margin + 16, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Due ${formatDate(notice.due_date)}`, margin + 16, y + 42);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(formatCurrency(notice.amount), pageWidth - margin - 16, y + 36, { align: "right" });

  y += 92;

  // Description
  if (notice.description && notice.description.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Details", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(notice.description, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 13;
  }

  // Total
  y += 24;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Amount Due", margin, y);
  doc.text(formatCurrency(notice.amount), pageWidth - margin, y, { align: "right" });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text(
    "Thank you. Please complete your payment by the due date above.",
    pageWidth / 2,
    pageHeight - 32,
    { align: "center" }
  );
  doc.setTextColor(0);

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