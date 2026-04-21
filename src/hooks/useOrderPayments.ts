import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderPayment {
  id: string;
  order_id: string;
  payment_number: number;
  amount: number;
  due_date: string | null;
  status: 'paid' | 'unpaid';
  paid_at: string | null;
  last_reminder_sent_at: string | null;
  notes: string | null;
}

export const useOrderPayments = (orderId?: string) => {
  const qc = useQueryClient();
  const { data: payments = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['order_payments', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_payments' as any)
        .select('*')
        .eq('order_id', orderId)
        .order('payment_number', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as OrderPayment[];
    },
    enabled: !!orderId,
  });

  return {
    payments,
    loading,
    refetch,
    invalidate: () => qc.invalidateQueries({ queryKey: ['order_payments', orderId] }),
  };
};
