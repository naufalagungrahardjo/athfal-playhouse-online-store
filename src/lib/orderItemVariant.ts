// Extracts session/plan info from order item, with fallback parsing for legacy items
// where the variant info wasn't stored in dedicated columns but embedded in
// product_name (e.g. "Foo [Early Bird] - Cicilan 2x") or product_id (e.g. "BASE__<uuid>").

export interface VariantInfo {
  baseName: string; // product_name without trailing " - <variant>" suffix
  sessionName?: string | null;
  planName?: string | null;
}

const PLAN_KEYWORDS = /(cicilan|pembayaran\s*lunas|lunas|installment|full\s*payment)/i;

export function extractVariantInfo(item: {
  product_name: string;
  product_id?: string;
  session_name?: string | null;
  installment_plan_name?: string | null;
}): VariantInfo {
  let baseName = item.product_name || '';
  let sessionName = item.session_name || null;
  let planName = item.installment_plan_name || null;

  // Fallback: parse trailing " - <suffix>" from product_name
  if (!sessionName && !planName) {
    const match = baseName.match(/^(.*?)\s+-\s+([^-]+?)\s*$/);
    if (match) {
      const suffix = match[2].trim();
      // Only treat as variant if it looks like a plan/session marker
      if (PLAN_KEYWORDS.test(suffix)) {
        baseName = match[1].trim();
        planName = suffix;
      }
    }
  }

  return { baseName, sessionName, planName };
}
