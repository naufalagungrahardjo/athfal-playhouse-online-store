import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  order_num: number;
}

export const useProductVariants = (productId?: string) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVariants = async (pid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', pid)
        .order('order_num', { ascending: true });
      if (error) throw error;
      setVariants(data || []);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchVariants(productId);
    }
  }, [productId]);

  return { variants, loading, fetchVariants };
};

// Fetch all variants for all products (for catalog lowest price display)
export const useAllProductVariants = () => {
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
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
        setVariantsByProduct(map);
      } catch {
        setVariantsByProduct({});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getLowestPrice = (productDbId: string, basePrice: number): number => {
    const variants = variantsByProduct[productDbId];
    if (!variants || variants.length === 0) return basePrice;
    const prices = [basePrice, ...variants.map(v => v.price)];
    return Math.min(...prices);
  };

  return { variantsByProduct, loading, getLowestPrice };
};
