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

    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      childName,
      childAge,
      childBirthdate,
      guardianStatus,
      notes,
      paymentMethod,
      totalAmount,
      subtotal,
      taxAmount,
      discountAmount,
      promoCode,
      items,
    } = await req.json();

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
    const formattedSubtotal = `Rp ${Number(subtotal || 0).toLocaleString("id-ID")}`;
    const formattedTax = `Rp ${Number(taxAmount || 0).toLocaleString("id-ID")}`;
    const formattedDiscount = discountAmount ? `Rp ${Number(discountAmount).toLocaleString("id-ID")}` : null;
    const shortId = orderId.slice(0, 8).toUpperCase();

    // Format child info section
    let childInfoSection = "";
    if (childName || childAge || childBirthdate || guardianStatus) {
      childInfoSection = `
          <tr>
            <td colspan="2" style="padding: 12px; background: #fff3f4; border-top: 2px solid #e91e63;">
              <h4 style="margin: 0 0 8px 0; color: #e91e63; font-size: 14px;">👶 Child Information</h4>
            </td>
          </tr>
          ${childName ? `
          <tr style="background: #fff3f4;">
            <td style="padding: 8px; font-weight: bold; color: #555; width: 35%;">Child Name</td>
            <td style="padding: 8px;">${childName}</td>
          </tr>` : ""}
          ${childAge ? `
          <tr style="background: #fff3f4;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Child Age</td>
            <td style="padding: 8px;">${childAge}</td>
          </tr>` : ""}
          ${childBirthdate ? `
          <tr style="background: #fff3f4;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Child Birthdate</td>
            <td style="padding: 8px;">${new Date(childBirthdate).toLocaleDateString("id-ID")}</td>
          </tr>` : ""}
          ${guardianStatus ? `
          <tr style="background: #fff3f4;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Guardian Status</td>
            <td style="padding: 8px;">${guardianStatus}</td>
          </tr>` : ""}
      `;
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e91e63; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">
          🛒 New Order Alert
        </h2>
        <p>A new order has been placed on Athfal Playhouse!</p>
        
        <h3 style="color: #333; margin: 20px 0 10px 0;">📋 Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555; width: 35%;">Order ID</td>
            <td style="padding: 8px;">#${shortId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Payment Method</td>
            <td style="padding: 8px;">${paymentMethod || "N/A"}</td>
          </tr>
          ${promoCode ? `
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Promo Code Used</td>
            <td style="padding: 8px;">${promoCode}</td>
          </tr>` : ""}
        </table>

        <h3 style="color: #333; margin: 20px 0 10px 0;">👤 Customer Information</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background: #f0f8ff;">
            <td style="padding: 8px; font-weight: bold; color: #555; width: 35%;">Name</td>
            <td style="padding: 8px;">${customerName || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 8px;">${customerEmail || "N/A"}</td>
          </tr>
          <tr style="background: #f0f8ff;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Phone</td>
            <td style="padding: 8px;">${customerPhone || "N/A"}</td>
          </tr>
          ${customerAddress ? `
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555; vertical-align: top;">Address</td>
            <td style="padding: 8px; white-space: pre-line;">${customerAddress}</td>
          </tr>` : ""}
          ${childInfoSection}
          ${notes ? `
          <tr style="background: #fffbe6;">
            <td style="padding: 8px; font-weight: bold; color: #555; vertical-align: top;">Notes</td>
            <td style="padding: 8px; white-space: pre-line;">${notes}</td>
          </tr>` : ""}
        </table>

        <h3 style="color: #333; margin: 20px 0 10px 0;">💰 Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555; width: 35%;">Subtotal</td>
            <td style="padding: 8px;">${formattedSubtotal}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">Tax</td>
            <td style="padding: 8px;">${formattedTax}</td>
          </tr>
          ${formattedDiscount ? `
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">Discount</td>
            <td style="padding: 8px; color: #e91e63;">-${formattedDiscount}</td>
          </tr>` : ""}
          <tr style="background: #e91e63; color: white;">
            <td style="padding: 12px; font-weight: bold;">Total Amount</td>
            <td style="padding: 12px; font-weight: bold; font-size: 16px;">${formattedTotal}</td>
          </tr>
        </table>

        <h3 style="color: #333; margin: 20px 0 10px 0;">📦 Items Ordered</h3>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; line-height: 1.8;">
          ${itemsList}
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;">
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          This is an automated notification from Athfal Playhouse order system.<br>
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
