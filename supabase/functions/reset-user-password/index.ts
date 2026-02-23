import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requester is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is super admin
    const { data: adminAccount, error: adminError } = await supabaseAdmin
      .from("admin_accounts")
      .select("role")
      .eq("email", user.email)
      .single();

    if (adminError || !adminAccount || adminAccount.role !== "super_admin") {
      throw new Error("Only super admins can reset passwords");
    }

    // Get request body
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error("userId and newPassword are required");
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (newPassword.length > 128) {
      throw new Error("Password must be less than 128 characters");
    }

    // Basic complexity: at least 2 of uppercase, lowercase, number, symbol
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
    const complexityCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    if (complexityCount < 2) {
      throw new Error("Password must include at least 2 of: uppercase, lowercase, numbers, symbols");
    }

    // Block common passwords
    const commonPasswords = [
      "password", "123456", "12345678", "qwerty", "abc123",
      "password123", "admin", "letmein", "welcome", "1234567890",
    ];
    if (commonPasswords.includes(newPassword.toLowerCase())) {
      throw new Error("Password is too common");
    }

    // Reset the user's password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error("Error resetting password:", error);
      throw error;
    }

    console.log(`Password reset successful for user ${userId} by admin ${user.email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
