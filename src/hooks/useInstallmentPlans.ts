import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstallmentPlan {
  id: string;
  product_id: string;
  name: string;
  num_payments: number;
  payment_amounts: number[]; // pre-defined amounts per stage (length = num_payments - 1, last stage auto = remainder)
  order_num: number;
}

export const useInstallmentPlans = (productDbId?: string) => {
  const qc = useQueryClient();
  const { data: plans = [], isLoading: loading } = useQuery({
    queryKey: ['installment_plans', productDbId],
    queryFn: async () => {
      if (!productDbId) return [];
      const { data, error } = await supabase
        .from('product_installment_plans' as any)
        .select('*')
        .eq('product_id', productDbId)
        .order('order_num', { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        payment_amounts: Array.isArray(p.payment_amounts) ? p.payment_amounts : [],
      })) as InstallmentPlan[];
    },
    enabled: !!productDbId,
  });

  return {
    plans,
    loading,
    invalidate: () => qc.invalidateQueries({ queryKey: ['installment_plans', productDbId] }),
  };
};
