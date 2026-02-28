
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseFAQ {
  id: string;
  question_id: string;
  question_en: string;
  answer_id: string;
  answer_en: string;
  category: string;
  order_num: number;
}

export interface BilingualStep {
  id: string;
  en: string;
}

export interface DatabasePaymentMethod {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  active: boolean;
  payment_steps?: BilingualStep[];
  image?: string;
}

const DEFAULT_STEPS: BilingualStep[] = [
  { id: "Buka aplikasi m-banking atau internet banking Anda.", en: "Open your m-banking or internet banking application." },
  { id: "Pilih menu Transfer.", en: "Select the bank transfer menu." },
  { id: "Masukan nomor rekening.", en: "Enter the account number." },
  { id: "Masukan nominal pembayaran.", en: "Enter the transfer amount." },
  { id: "Selesaikan pembayaran.", en: "Confirm and complete your transfer." },
  { id: "Simpan bukti pembayaran Anda.", en: "Save your payment receipt." },
];

// Convert legacy string[] to BilingualStep[]
function normalizeSteps(steps: any): BilingualStep[] {
  if (!Array.isArray(steps)) return DEFAULT_STEPS;
  return steps.map((step: any) => {
    if (typeof step === 'string') {
      return { id: step, en: step };
    }
    if (step && typeof step === 'object' && 'id' in step && 'en' in step) {
      return { id: step.id, en: step.en };
    }
    return { id: String(step), en: String(step) };
  });
}

export { DEFAULT_STEPS };

export const useDatabase = () => {
  const [faqs, setFaqs] = useState<DatabaseFAQ[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DatabasePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFAQs = async () => {
    try {
      console.log('Fetching FAQs from database...');
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_num');

      if (error) {
        console.error('Error fetching FAQs:', error);
        throw error;
      }
      
      console.log('FAQs fetched:', data);
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      console.log('Fetching payment methods from database...');
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }
      
      console.log('Payment methods fetched:', data);
      const processedData: DatabasePaymentMethod[] = data?.map(method => ({
        id: method.id,
        bank_name: method.bank_name,
        account_number: method.account_number,
        account_name: method.account_name,
        active: method.active,
        payment_steps: normalizeSteps(method.payment_steps),
        image: (method as any).image || undefined,
      })) || [];
      
      setPaymentMethods(processedData);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const saveFAQ = async (faq: Omit<DatabaseFAQ, 'id'> & { id?: string }) => {
    try {
      console.log('Saving FAQ:', faq);
      const { error } = await supabase
        .from('faqs')
        .upsert({
          ...faq,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving FAQ:', error);
        throw error;
      }

      console.log('FAQ saved successfully');
      toast({
        title: "Success",
        description: "FAQ saved successfully"
      });

      await fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save FAQ"
      });
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      console.log('Deleting FAQ:', id);
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting FAQ:', error);
        throw error;
      }

      console.log('FAQ deleted successfully');
      toast({
        title: "Success",
        description: "FAQ deleted successfully"
      });

      await fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete FAQ"
      });
    }
  };

  const savePaymentMethod = async (paymentMethod: Omit<DatabasePaymentMethod, 'id'> & { id?: string }) => {
    try {
      console.log('Saving payment method:', paymentMethod);
      const { error } = await supabase
        .from('payment_methods')
        .upsert({
          ...paymentMethod,
          payment_steps: (paymentMethod.payment_steps || DEFAULT_STEPS) as unknown as any,
          image: paymentMethod.image || null,
          updated_at: new Date().toISOString()
        } as any);

      if (error) {
        console.error('Error saving payment method:', error);
        throw error;
      }

      console.log('Payment method saved successfully');
      toast({
        title: "Success",
        description: "Payment method saved successfully"
      });

      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save payment method"
      });
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      console.log('Deleting payment method:', id);
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment method:', error);
        throw error;
      }

      console.log('Payment method deleted successfully');
      toast({
        title: "Success",
        description: "Payment method deleted successfully"
      });

      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment method"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFAQs(), fetchPaymentMethods()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    faqs,
    paymentMethods,
    loading,
    saveFAQ,
    deleteFAQ,
    savePaymentMethod,
    deletePaymentMethod,
    fetchFAQs,
    fetchPaymentMethods
  };
};
