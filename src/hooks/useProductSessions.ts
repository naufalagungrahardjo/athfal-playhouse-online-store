import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductSession {
  id: string;
  product_id: string;
  name: string;
  stock: number;
  is_sold_out: boolean;
  order_num: number;
}

export const useProductSessions = (productDbId?: string) => {
  const qc = useQueryClient();
  const { data: sessions = [], isLoading: loading } = useQuery({
    queryKey: ['product_sessions', productDbId],
    queryFn: async () => {
      if (!productDbId) return [];
      const { data, error } = await supabase
        .from('product_sessions' as any)
        .select('*')
        .eq('product_id', productDbId)
        .order('order_num', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ProductSession[];
    },
    enabled: !!productDbId,
  });

  return {
    sessions,
    loading,
    invalidate: () => qc.invalidateQueries({ queryKey: ['product_sessions', productDbId] }),
  };
};

export const useAllProductSessions = () => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['all_product_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sessions' as any)
        .select('*')
        .order('order_num', { ascending: true });
      if (error) throw error;
      const map: Record<string, ProductSession[]> = {};
      ((data || []) as unknown as ProductSession[]).forEach(s => {
        if (!map[s.product_id]) map[s.product_id] = [];
        map[s.product_id].push(s);
      });
      return map;
    },
  });
  return { sessionsByProduct: data || {}, loading };
};
