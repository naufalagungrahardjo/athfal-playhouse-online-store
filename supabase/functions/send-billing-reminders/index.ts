import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://athfalplayhouse.com";
const APP_URL = Deno.env.get("APP_URL") || SITE_URL;
const LOGO_URL = `${SITE_URL.replace(/\/$/, "")}/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png`;

const BRAND = {
  pink: "#d38a82",
  peach: "#eecdc4",
  lightPeach: "#faf0eb",
  green: "#6d7b6b",
  teal: "#9fb9bb",
  yellow: "#e9c873",
  text: "#3c3c3c",
  muted: "#828282",
  white: "#ffffff",
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string | null | undefined) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return d;
  }
};

const formatDateTime = (d: string | null | undefined) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB";
  } catch {
    return d;
  }
};

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const normalizeSteps = (steps: unknown, amount: number, accountNumber: string) => {
  if (!Array.isArray(steps)) return [] as string[];
  return steps
    .map((step) => {
      const raw = typeof step === "string"
        ? step
        : typeof step === "object" && step !== null
          ? String((step as Record<string, unknown>).id || (step as Record<string, unknown>).en || "")
          : String(step ?? "");

      return raw
        .replace(/account number/gi, accountNumber)
        .replace(/nomor rekening/gi, accountNumber)
        .replace(/transfer amount/gi, formatIDR(amount))
        .replace(/jumlah transfer/gi, formatIDR(amount));
    })
    .filter(Boolean);
};

const paymentMethodCard = (pm: {
  bank_name: string;
  account_name: string;
  account_number: string;
  image: string | null;
  payment_steps: unknown;
}, amount: number, index: number) => {
  const steps = normalizeSteps(pm.payment_steps, amount, pm.account_number);

  return `
    <div style="border:1px solid ${BRAND.peach}; border-radius:16px; overflow:hidden; margin:0 0 20px; background:${BRAND.white};">
      <div style="background:${BRAND.green}; color:${BRAND.white}; padding:12px 18px; font-size:16px; font-weight:700;">
        Option ${index + 1}: ${escapeHtml(pm.bank_name)}
      </div>
      <div style="padding:18px; background:${BRAND.lightPeach};">
        ${pm.image ? `
          <div style="text-align:center; margin:0 0 16px;">
            <img src="${escapeHtml(pm.image)}" alt="${escapeHtml(pm.bank_name)}" style="max-width:220px; max-height:220px; width:auto; height:auto; border-radius:12px; background:${BRAND.white}; padding:10px; border:1px solid ${BRAND.peach};" />
          </div>` : ""}
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:${BRAND.text};">
          <tr>
            <td style="padding:0 0 8px; width:140px; color:${BRAND.green}; font-weight:700; vertical-align:top;">Account Number</td>
            <td style="padding:0 0 8px; font-weight:700; color:${BRAND.pink};">${escapeHtml(pm.account_number)}</td>
          </tr>
          <tr>
            <td style="padding:0; color:${BRAND.green}; font-weight:700; vertical-align:top;">Account Name</td>
            <td style="padding:0; font-weight:600;">${escapeHtml(pm.account_name)}</td>
          </tr>
        </table>
      </div>
      ${steps.length ? `
      <div style="padding:18px;">
        <div style="font-size:15px; font-weight:700; color:${BRAND.green}; margin:0 0 10px;">Payment Steps</div>
        <ol style="margin:0; padding-left:18px; color:${BRAND.text}; line-height:1.7; font-size:14px;">
          ${steps.map((step) => `<li style="margin:0 0 6px;">${escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>` : ""}
    </div>`;
};

const buildBillingHtml = ({
  notice,
  order,
  paymentMethods,
  orderLink,
}: {
  notice: { title: string; amount: number; due_date: string; due_at: string | null; description: string | null; };
  order: { id: string; customer_name: string; customer_email: string; customer_phone?: string | null; customer_address?: string | null; lookup_token?: string | null; };
  paymentMethods: Array<{ bank_name: string; account_name: string; account_number: string; image: string | null; payment_steps: unknown }>;
  orderLink: string;
}) => `
  <div style="margin:0; padding:24px 12px; background:${BRAND.lightPeach}; font-family:Arial, Helvetica, sans-serif; color:${BRAND.text};">
    <div style="max-width:680px; margin:0 auto; background:${BRAND.white}; border-radius:24px; overflow:hidden; border:1px solid ${BRAND.peach};">
      <div style="height:8px; background:${BRAND.peach};"></div>
      <div style="padding:28px 28px 8px;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;">
              <img src="${LOGO_URL}" alt="Athfal Playhouse logo" style="width:56px; height:56px; object-fit:contain; display:block;" />
            </td>
            <td style="vertical-align:middle; padding-left:14px;">
              <div style="font-size:22px; line-height:1.1; font-weight:700; color:${BRAND.green};">Athfal Playhouse</div>
              <div style="font-size:13px; color:${BRAND.muted}; margin-top:4px;">athfalplayhouse.com</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:20px 28px 28px;">
        <div style="background:${BRAND.pink}; color:${BRAND.white}; border-radius:16px; padding:18px 20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="font-size:22px; font-weight:700;">BILLING NOTICE</td>
              <td style="text-align:right; font-size:13px; line-height:1.6;">
                <div>Issued: ${escapeHtml(formatDate(new Date().toISOString()))}</div>
                <div>Due: ${escapeHtml(formatDateTime(notice.due_at || notice.due_date))}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top:26px;">
          <div style="font-size:14px; font-weight:700; color:${BRAND.green}; margin-bottom:10px;">Bill To</div>
          <div style="font-size:15px; line-height:1.8; color:${BRAND.text};">
            <div style="font-weight:700;">${escapeHtml(order.customer_name || "-")}</div>
            ${order.customer_email ? `<div>${escapeHtml(order.customer_email)}</div>` : ""}
            ${order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : ""}
            ${order.customer_address ? `<div style="white-space:pre-wrap;">${escapeHtml(order.customer_address)}</div>` : ""}
            <div style="font-size:13px; color:${BRAND.muted}; margin-top:8px;">Order Reference: ${escapeHtml(order.id)}</div>
          </div>
        </div>

        <div style="margin-top:24px; border:1px solid ${BRAND.peach}; border-radius:18px; background:${BRAND.lightPeach}; padding:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td>
                <div style="font-size:20px; font-weight:700; color:${BRAND.green}; margin:0 0 8px;">${escapeHtml(notice.title)}</div>
                <div style="font-size:14px; color:${BRAND.muted};">Due ${escapeHtml(formatDateTime(notice.due_at || notice.due_date))}</div>
              </td>
              <td style="text-align:right; vertical-align:top; font-size:30px; font-weight:700; color:${BRAND.pink}; white-space:nowrap;">
                ${escapeHtml(formatIDR(notice.amount))}
              </td>
            </tr>
          </table>
        </div>

        ${notice.description?.trim() ? `
          <div style="margin-top:22px;">
            <div style="font-size:14px; font-weight:700; color:${BRAND.green}; margin-bottom:8px;">Details</div>
            <div style="font-size:14px; line-height:1.8; white-space:pre-wrap;">${escapeHtml(notice.description)}</div>
          </div>` : ""}

        <div style="margin-top:24px; border-top:1px solid ${BRAND.peach}; padding-top:18px;">
          <table style="width:100%; border-collapse:collapse; font-size:16px;">
            <tr>
              <td style="font-weight:700; color:${BRAND.green};">Amount Due</td>
              <td style="text-align:right; font-weight:700; color:${BRAND.pink};">${escapeHtml(formatIDR(notice.amount))}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top:22px; padding:18px 20px; border-radius:16px; background:${BRAND.teal}; color:${BRAND.white};">
          Thank you. Please complete your payment by the due date above.
        </div>

        ${paymentMethods.length ? `
          <div style="margin-top:30px; border-top:1px solid ${BRAND.peach}; padding-top:26px;">
            <div style="font-size:24px; font-weight:700; color:${BRAND.pink}; margin:0 0 12px;">How to Pay</div>
            <div style="font-size:14px; line-height:1.7; color:${BRAND.text}; margin:0 0 18px;">
              Total Amount: <strong>${escapeHtml(formatIDR(notice.amount))}</strong>. Please use one of the payment methods below and follow the steps to complete your payment.
            </div>
            ${paymentMethods.map((pm, index) => paymentMethodCard(pm, notice.amount, index)).join("")}
            <div style="padding:18px 20px; border-radius:16px; background:${BRAND.peach}; color:${BRAND.green}; font-size:14px; line-height:1.7; font-weight:600;">
              After Payment<br />
              <span style="font-weight:400; color:${BRAND.text};">Please send your payment proof via WhatsApp so we can confirm your payment as soon as possible.</span>
            </div>
          </div>` : ""}

        <div style="margin-top:28px; text-align:center;">
          <a href="${escapeHtml(orderLink)}" style="display:inline-block; background:${BRAND.green}; color:${BRAND.white}; text-decoration:none; font-weight:700; padding:14px 24px; border-radius:999px;">Open order details</a>
        </div>
      </div>
      <div style="height:8px; background:${BRAND.peach};"></div>
    </div>
  </div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require shared cron secret to prevent unauthenticated abuse / spam
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided =
      req.headers.get("x-cron-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!cronSecret || provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const nowIso = new Date().toISOString();

    const { data: notices, error: ne } = await supabase
      .from("billing_notices")
      .select("id,title,amount,due_date,due_at,description")
      .or(`due_at.lte.${nowIso},and(due_at.is.null,due_date.lte.${nowIso.slice(0,10)})`);
    if (ne) throw ne;
    if (!notices?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no notices due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const noticeIds = notices.map((n: any) => n.id);
    const { data: assigns, error: ae } = await supabase
      .from("billing_notice_assignments")
      .select("id,notice_id,order_id,email_reminder_enabled,email_reminder_sent_at")
      .in("notice_id", noticeIds)
      .eq("email_reminder_enabled", true)
      .is("email_reminder_sent_at", null);
    if (ae) throw ae;
    if (!assigns?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no enabled assignments" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderIds = [...new Set(assigns.map((a: any) => a.order_id))];
    const [ordersRes, paymentMethodsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id,customer_name,customer_email,customer_phone,customer_address,lookup_token")
        .in("id", orderIds),
      supabase
        .from("payment_methods")
        .select("bank_name,account_name,account_number,image,payment_steps")
        .eq("active", true)
        .order("created_at", { ascending: true }),
    ]);

    if (ordersRes.error) throw ordersRes.error;
    if (paymentMethodsRes.error) throw paymentMethodsRes.error;

    const orderMap = new Map((ordersRes.data || []).map((o: any) => [o.id, o]));
    const noticeMap = new Map((notices || []).map((n: any) => [n.id, n]));
    const paymentMethods = (paymentMethodsRes.data || []) as Array<{
      bank_name: string;
      account_name: string;
      account_number: string;
      image: string | null;
      payment_steps: unknown;
    }>;

    let sent = 0;
    const errors: Array<Record<string, unknown>> = [];

    for (const assignment of assigns as any[]) {
      const order = orderMap.get(assignment.order_id);
      const notice = noticeMap.get(assignment.notice_id);
      if (!order?.customer_email || !notice) continue;

      const orderLink = order.lookup_token
        ? `${APP_URL.replace(/\/$/, "")}/order-details/${order.id}?token=${order.lookup_token}`
        : `${APP_URL.replace(/\/$/, "")}/order-details/${order.id}`;

      const html = buildBillingHtml({
        notice,
        order,
        paymentMethods,
        orderLink,
      });

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Athfal Playhouse <halo@athfalplayhouse.com>",
          to: [order.customer_email],
          subject: `Pengingat Tagihan: ${notice.title}`,
          html,
        }),
      });

      if (!response.ok) {
        errors.push({ assignment: assignment.id, status: response.status, body: await response.text() });
        continue;
      }

      const { error: updateError } = await supabase
        .from("billing_notice_assignments")
        .update({ email_reminder_sent_at: new Date().toISOString() })
        .eq("id", assignment.id);

      if (updateError) {
        errors.push({ assignment: assignment.id, status: 500, body: updateError.message });
        continue;
      }

      sent += 1;
    }

    return new Response(JSON.stringify({ ok: true, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
