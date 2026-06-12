import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  order_num: number;
  price_divisions?: number[];
  quota_limit?: number | null;
  quota_sold?: number;
}

// Normalize the jsonb price_divisions column into a number[]; fall back to [price]
export const normalizeDivisions = (raw: unknown, price: number): number[] => {
  if (Array.isArray(raw)) {
    const nums = raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    if (nums.length > 0) return nums;
  }
  return price > 0 ? [price] : [];
};

const mapVariant = (v: any): ProductVariant => ({
  id: v.id,
  product_id: v.product_id,
  name: v.name,
  price: v.price,
  order_num: v.order_num,
  price_divisions: normalizeDivisions(v.price_divisions, v.price),
  quota_limit: v.quota_limit ?? null,
  quota_sold: v.quota_sold ?? 0,
});

// Remaining purchasable quota for a variant. null = unlimited.
export const getVariantRemaining = (v: ProductVariant): number | null => {
  if (v.quota_limit === null || v.quota_limit === undefined) return null;
  return Math.max(0, v.quota_limit - (v.quota_sold || 0));
};

export const useProductVariants = (productId?: string) => {
  const queryClient = useQueryClient();

  const { data: variants = [], isLoading: loading } = useQuery({
    queryKey: ['product_variants', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('order_num', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapVariant);
    },
    enabled: !!productId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['product_variants', productId] });
    queryClient.invalidateQueries({ queryKey: ['all_product_variants'] });
  };

  return { variants, loading, invalidate };
};

// Fetch all variants for all products (for catalog lowest price display)
export const useAllProductVariants = () => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['all_product_variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .order('order_num', { ascending: true });
      if (error) throw error;
      const map: Record<string, ProductVariant[]> = {};
      (data || []).forEach((v) => {
        const mapped = mapVariant(v);
        if (!map[mapped.product_id]) map[mapped.product_id] = [];
        map[mapped.product_id].push(mapped);
      });
      return map;
    },
  });

  const variantsByProduct = data || {};

  const getLowestPrice = (productDbId: string, basePrice: number): number => {
    const variants = variantsByProduct[productDbId];
    if (!variants || variants.length === 0) return basePrice;
    const prices = [basePrice, ...variants.map(v => v.price)];
    return Math.min(...prices);
  };

  return { variantsByProduct, loading, getLowestPrice };
};
