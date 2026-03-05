import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { orderId, customerName, customerEmail, totalAmount, items } = await req.json();

    if (!orderId) {
      throw new Error("orderId is required");
    }

    // Fetch admin accounts with order_alerts enabled
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: alertAdmins, error: adminError } = await supabaseAdmin
      .from("admin_accounts")
      .select("email")
      .eq("order_alerts", true);

    if (adminError) {
      throw new Error(`Failed to fetch alert recipients: ${adminError.message}`);
    }

    if (!alertAdmins || alertAdmins.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No alert recipients configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmails = alertAdmins.map((a: any) => a.email);

    // Format items list
    const itemsList = items?.map((item: any) =>
      `• ${item.product_name} x${item.quantity} - Rp ${Number(item.product_price * item.quantity).toLocaleString("id-ID")}`
    ).join("<br>") || "No items";

    const formattedTotal = `Rp ${Number(totalAmount).toLocaleString("id-ID")}`;
    const shortId = orderId.slice(0, 8).toUpperCase();

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e91e63; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">
          🛒 New Order Alert
        </h2>
        <p>A new order has been placed on Athfal Playhouse!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Order ID</td>
            <td style="padding: 8px;">#${shortId}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Customer</td>
            <td style="padding: 8px;">${customerName || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 8px;">${customerEmail || "N/A"}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Total</td>
            <td style="padding: 8px; font-weight: bold; color: #e91e63;">${formattedTotal}</td>
          </tr>
        </table>
        <h3 style="color: #333;">Items Ordered:</h3>
        <p style="line-height: 1.8;">${itemsList}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from Athfal Playhouse order system.
          You can disable these alerts in Admin → Accounts.
        </p>
      </div>
    `;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Athfal Playhouse <halo@athfalplayhouse.com>",
        to: recipientEmails,
        subject: `🛒 New Order #${shortId} - ${customerName || "Guest"} (${formattedTotal})`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(`Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent: recipientEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order alert email error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
