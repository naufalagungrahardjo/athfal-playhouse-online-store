type ProductRecord = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

type VariantRecord = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

type OrderItemRecord = {
  product_id: string;
  product_name: string;
  product_price: number;
  session_name?: string | null;
  installment_plan_name?: string | null;
};

export const getBaseProductId = (productId: string) => productId.split('__')[0];

export const getVariantIdFromProductId = (productId: string) => {
  const marker = productId.split('__')[1] || '';
  if (!marker || marker === 'normal') return null;
  if (marker.startsWith('variant_')) return marker.slice(8) || null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(marker)) {
    return marker;
  }
  return null;
};

const extractTrailingPlan = (productName: string, baseProductName?: string | null) => {
  const name = productName?.trim();
  const base = baseProductName?.trim();
  if (!name || !base || !name.startsWith(base)) return null;

  const suffix = name.slice(base.length).trim();
  if (!suffix.startsWith('-')) return null;

  const planName = suffix.replace(/^[-–—]\s*/, '').trim();
  return planName || null;
};

export const resolveOrderItemMetadata = (
  item: OrderItemRecord,
  product?: ProductRecord | null,
  variants: VariantRecord[] = []
) => {
  const existingSession = item.session_name?.trim() || null;
  const existingPlan = item.installment_plan_name?.trim() || null;
  const baseName = product?.name?.trim() || item.product_name?.trim() || '';
  const variantId = getVariantIdFromProductId(item.product_id);

  const matchedVariantById = variantId
    ? variants.find((variant) => variant.id === variantId)
    : null;

  const matchedVariantsByPrice = variants.filter(
    (variant) => Number(variant.price) === Number(item.product_price)
  );

  const extractedPlan = extractTrailingPlan(item.product_name, product?.name);
  const inferredPlan =
    existingPlan ||
    extractedPlan ||
    matchedVariantById?.name ||
    (matchedVariantsByPrice.length === 1 ? matchedVariantsByPrice[0].name : null) ||
    (variants.length > 0 && product && Number(product.price) === Number(item.product_price)
      ? 'Pembayaran Lunas'
      : null);

  return {
    product_name: product?.name || item.product_name,
    session_name: existingSession,
    installment_plan_name: inferredPlan,
    base_product_name: baseName,
  };
};