import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LONG_CACHE = "31536000"; // 1 year
const BUCKET = "images";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- Authn/authz: caller must be a super_admin ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const email = userData?.user?.email;
    if (!email) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: acct } = await admin
      .from("admin_accounts")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (!acct || acct.role !== "super_admin") {
      return json({ error: "Forbidden: super_admin only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const prefix: string = body.prefix ?? "uploads";
    const offset: number = Number(body.offset ?? 0);
    const limit: number = Math.min(Number(body.limit ?? 50), 100);

    // List a page of files under the prefix.
    const { data: files, error: listErr } = await admin.storage
      .from(BUCKET)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
    if (listErr) throw listErr;

    let processed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const f of files ?? []) {
      // Skip "folders" (entries without metadata) e.g. the thumb/ subfolder.
      if (!f.metadata) {
        skipped++;
        continue;
      }
      const path = `${prefix}/${f.name}`;
      const current = (f.metadata as Record<string, unknown>)?.cacheControl;
      // Already long-cached -> skip to keep this idempotent & cheap.
      if (typeof current === "string" && current.includes("31536000")) {
        skipped++;
        continue;
      }
      try {
        const { data: blob, error: dlErr } = await admin.storage
          .from(BUCKET)
          .download(path);
        if (dlErr || !blob) throw dlErr ?? new Error("download failed");
        const contentType =
          (f.metadata as Record<string, unknown>)?.mimetype as string ||
          blob.type ||
          "application/octet-stream";
        const { error: upErr } = await admin.storage
          .from(BUCKET)
          .upload(path, blob, {
            upsert: true,
            cacheControl: LONG_CACHE,
            contentType,
          });
        if (upErr) throw upErr;
        processed++;
      } catch (e) {
        errors.push(`${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const returned = files?.length ?? 0;
    const nextOffset = offset + returned;
    const done = returned < limit;

    return json({
      prefix,
      offset,
      returned,
      processed,
      skipped,
      errors,
      nextOffset,
      done,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
