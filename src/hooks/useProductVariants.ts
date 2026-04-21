import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  order_num: number;
}

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
      return (data || []) as ProductVariant[];
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
      (data || []).forEach(v => {
        if (!map[v.product_id]) map[v.product_id] = [];
        map[v.product_id].push(v);
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
