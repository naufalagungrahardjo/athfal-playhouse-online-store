import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  applies_to: string;
  applicable_product_ids: string[];
  applicable_category_slugs: string[];
  created_at?: string;
  updated_at?: string;
}

export const usePromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      console.log('Fetching promo codes from database...');
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase promo codes error:', error);
        throw error;
      }
      
      setPromoCodes(data || []);
      console.log('Promo codes fetched:', data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch promo codes"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePromoCode = async (promoCode: Omit<PromoCode, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    try {
      console.log('Saving promo code:', promoCode);

      // Validate required fields
      if (!promoCode.code?.trim()) {
        throw new Error('Promo code is required');
      }
      if (!promoCode.discount_percentage || promoCode.discount_percentage < 1 || promoCode.discount_percentage > 100) {
        throw new Error('Discount percentage must be between 1 and 100');
      }

      const promoData = {
        code: promoCode.code.trim().toUpperCase(),
        discount_percentage: promoCode.discount_percentage,
        description: promoCode.description?.trim() || null,
        is_active: promoCode.is_active,
        valid_from: promoCode.valid_from ? new Date(promoCode.valid_from).toISOString() : null,
        valid_until: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString() : null,
        usage_limit: promoCode.usage_limit,
        usage_count: promoCode.usage_count || 0,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (promoCode.id && promoCode.id !== '' && !promoCode.id.startsWith('promo_')) {
        // Update existing promo code
        result = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', promoCode.id);
      } else {
        // Insert new promo code
        result = await supabase
          .from('promo_codes')
          .insert([promoData]);
      }

      if (result.error) {
        console.error('Save promo code error:', result.error);
        throw result.error;
      }

      console.log('Promo code saved successfully');
      toast({
        title: "Success",
        description: "Promo code saved successfully"
      });

      await fetchPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save promo code"
      });
      throw error;
    }
  };

  const deletePromoCode = async (id: string) => {
    try {
      console.log('Deleting promo code:', id);
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete promo code error:', error);
        throw error;
      }

      console.log('Promo code deleted successfully');
      toast({
        title: "Success",
        description: "Promo code deleted successfully"
      });

      await fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete promo code"
      });
    }
  };

  useEffect(() => {
    fetchPromoCodes();

    // Set up real-time subscription
    const channel = supabase
      .channel('promo-codes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promo_codes'
        },
        () => {
          console.log('Promo codes table changed, refetching...');
          fetchPromoCodes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    promoCodes,
    loading,
    fetchPromoCodes,
    savePromoCode,
    deletePromoCode
  };
};