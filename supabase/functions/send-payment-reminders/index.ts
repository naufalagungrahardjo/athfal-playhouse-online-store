import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const fmtIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

async function sendReminderForPayment(paymentId: string) {
  const { data: payment } = await supabase.from('order_payments').select('*').eq('id', paymentId).single();
  if (!payment || payment.status === 'paid') return { skipped: true };

  const { data: order } = await supabase.from('orders').select('*').eq('id', payment.order_id).single();
  if (!order) return { skipped: true };

  // Check if product reminders are enabled (use first item's product)
  const { data: items } = await supabase.from('order_items').select('product_id').eq('order_id', order.id).limit(1);
  if (items && items[0]) {
    const { data: prod } = await supabase.from('products').select('payment_reminders_enabled').eq('product_id', items[0].product_id).single();
    if (prod && prod.payment_reminders_enabled === false) return { skipped: true, reason: 'reminders_disabled' };
  }

  const { data: pm } = await supabase.from('payment_methods').select('bank_name, account_number, account_name').eq('bank_name', order.payment_method).single();

  const dueLabel = payment.due_date ? new Date(payment.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const bankInfo = pm
    ? `<p><strong>Bank:</strong> ${pm.bank_name}<br/><strong>No. Rekening:</strong> ${pm.account_number}<br/><strong>Atas Nama:</strong> ${pm.account_name}</p>`
    : `<p><strong>Metode:</strong> ${order.payment_method}</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
      <h2 style="color:#e91e63">Pengingat Pembayaran / Payment Reminder</h2>
      <p>Halo <strong>${order.customer_name}</strong>,</p>

      <p><strong>[ID]</strong> Mohon maaf mengganggu, kami ingin mengingatkan bahwa pembayaran ke-${payment.payment_number} untuk pesanan Anda telah jatuh tempo.</p>
      <p><strong>[EN]</strong> This is a friendly reminder that payment #${payment.payment_number} for your order is due.</p>

      <div style="background:#fff3cd;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:4px 0"><strong>Jumlah / Amount:</strong> ${fmtIDR(payment.amount)}</p>
        <p style="margin:4px 0"><strong>Jatuh Tempo / Due Date:</strong> ${dueLabel}</p>
        <p style="margin:4px 0"><strong>Order ID:</strong> ${order.id.slice(0, 8)}...</p>
      </div>

      <h3>Metode Pembayaran / Payment Method</h3>
      ${bankInfo}

      <p style="margin-top:20px"><strong>[ID]</strong> Setelah melakukan pembayaran, mohon konfirmasi melalui WhatsApp kami.</p>
      <p><strong>[EN]</strong> After making payment, please confirm via our WhatsApp.</p>

      <p style="color:#666;font-size:12px;margin-top:30px">Athfal Playhouse · athfalplayhouse.com</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Athfal Playhouse <onboarding@resend.dev>',
      to: [order.customer_email],
      subject: `Pengingat Pembayaran #${payment.payment_number} — ${fmtIDR(payment.amount)}`,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { error: txt };
  }

  await supabase.from('order_payments').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', paymentId);
  return { sent: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let body: any = {};
    try { body = await req.json(); } catch {}

    // Manual single-payment reminder
    if (body.payment_id) {
      const result = await sendReminderForPayment(body.payment_id);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cron mode: find all overdue unpaid payments not reminded in last 24h
    const today = new Date().toISOString().split('T')[0];
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: due } = await supabase
      .from('order_payments')
      .select('id')
      .eq('status', 'unpaid')
      .lte('due_date', today)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${since24h}`);

    const results = [];
    for (const p of (due || [])) {
      results.push(await sendReminderForPayment(p.id));
    }
    return new Response(JSON.stringify({ checked: (due || []).length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
