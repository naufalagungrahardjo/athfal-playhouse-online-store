import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const nowIso = new Date().toISOString();

    // Find notices whose scheduled send time (due_at) has been reached.
    // Falls back to due_date at 06:00 Asia/Jakarta if due_at is null.
    const { data: notices, error: ne } = await supabase
      .from("billing_notices")
      .select("id,title,amount,due_date,due_at,description")
      .or(`due_at.lte.${nowIso},and(due_at.is.null,due_date.lte.${nowIso.slice(0,10)})`);
    if (ne) throw ne;
    if (!notices || notices.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no notices due today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const noticeIds = notices.map((n: any) => n.id);
    const { data: assigns, error: ae } = await supabase
      .from("billing_notice_assignments")
      .select("id,notice_id,order_id,email_reminder_enabled,email_reminder_sent_at")
      .in("notice_id", noticeIds)
      .is("email_reminder_sent_at", null);
    if (ae) throw ae;
    if (!assigns || assigns.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no enabled assignments" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderIds = [...new Set(assigns.map((a: any) => a.order_id))];
    const { data: orders } = await supabase
      .from("orders")
      .select("id,customer_name,customer_email")
      .in("id", orderIds);
    const orderMap = new Map((orders || []).map((o: any) => [o.id, o]));
    const noticeMap = new Map(notices.map((n: any) => [n.id, n]));

    let sent = 0;
    const errors: any[] = [];

    for (const a of assigns as any[]) {
      const order: any = orderMap.get(a.order_id);
      const notice: any = noticeMap.get(a.notice_id);
      if (!order?.customer_email || !notice) continue;

      const dueSource = notice.due_at ? new Date(notice.due_at) : new Date(notice.due_date);
      const due = dueSource.toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB";
      const html = `
        <div style="font-family:Arial,sans-serif;color:#333;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#d38a82;margin:0 0 12px">Pengingat Tagihan — ${notice.title}</h2>
          <p>Halo ${order.customer_name || "Pelanggan"},</p>
          <p>Ini adalah pengingat bahwa tagihan berikut jatuh tempo <strong>hari ini (${due})</strong>:</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:8px;border:1px solid #eee">Judul</td><td style="padding:8px;border:1px solid #eee"><strong>${notice.title}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Jumlah</td><td style="padding:8px;border:1px solid #eee"><strong>${formatIDR(notice.amount)}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #eee">Jatuh Tempo</td><td style="padding:8px;border:1px solid #eee">${due}</td></tr>
          </table>
          ${notice.description ? `<p style="white-space:pre-wrap;color:#555">${notice.description}</p>` : ""}
          <p style="margin-top:24px">Terima kasih,<br/><strong>Athfal Playhouse</strong></p>
        </div>`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Athfal Playhouse <onboarding@resend.dev>",
          to: [order.customer_email],
          subject: `Pengingat Tagihan: ${notice.title}`,
          html,
        }),
      });

      if (!r.ok) {
        errors.push({ assignment: a.id, status: r.status, body: await r.text() });
        continue;
      }

      await supabase
        .from("billing_notice_assignments")
        .update({ email_reminder_sent_at: new Date().toISOString() })
        .eq("id", a.id);
      sent++;
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