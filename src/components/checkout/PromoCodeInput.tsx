import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tag, X } from 'lucide-react';

type PromoCode = {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
};

interface PromoCodeInputProps {
  appliedPromo: PromoCode | null;
  onApplyPromo: (promo: PromoCode) => void;
  onRemovePromo: () => void;
}

export default function PromoCodeInput({ appliedPromo, onApplyPromo, onRemovePromo }: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a promo code"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching promo code:', error);
        throw error;
      }

      if (!data) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "This promo code is not valid or has expired"
        });
        return;
      }

      // Validate date range
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        toast({
          variant: "destructive",
          title: "Not Active Yet",
          description: "This promo code is not active yet"
        });
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        toast({
          variant: "destructive",
          title: "Expired",
          description: "This promo code has expired"
        });
        return;
      }

      // Apply the promo code
      onApplyPromo(data);
      localStorage.setItem('appliedPromo', JSON.stringify(data));
      setPromoCode('');
      
      toast({
        title: "Success!",
        description: `${data.discount_percentage}% discount applied`
      });
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply promo code"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromo = () => {
    onRemovePromo();
    localStorage.removeItem('appliedPromo');
    toast({
      title: "Removed",
      description: "Promo code removed"
    });
  };

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-green-600" />
          <div>
            <p className="font-medium text-green-900">{appliedPromo.code}</p>
            <p className="text-sm text-green-700">{appliedPromo.discount_percentage}% discount</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemovePromo}
          className="text-green-700 hover:text-green-900 hover:bg-green-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={handleApplyPromo}
          disabled={loading || !promoCode.trim()}
          variant="outline"
          className="whitespace-nowrap"
        >
          {loading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
    </div>
  );
}
