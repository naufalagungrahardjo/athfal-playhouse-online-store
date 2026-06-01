import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { normalizeDivisions } from '@/hooks/useProductVariants';
import { formatCurrency } from '@/lib/utils';

interface Variant {
  id?: string;
  name: string;
  order_num: number;
  divisions: number[];
}

interface ProductVariantManagerProps {
  productDbId: string | undefined;
}

export const ProductVariantManager = ({ productDbId }: ProductVariantManagerProps) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (productDbId) {
      fetchVariants();
    }
  }, [productDbId]);

  const fetchVariants = async () => {
    if (!productDbId) return;
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productDbId)
      .order('order_num', { ascending: true });
    if (!error && data) {
      setVariants(
        data.map((v) => ({
          id: v.id,
          name: v.name,
          order_num: v.order_num,
          divisions: normalizeDivisions((v as any).price_divisions, v.price),
        }))
      );
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', order_num: variants.length + 1, divisions: [0] }]);
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      await supabase.from('product_variants').delete().eq('id', variant.id);
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantName = (index: number, value: string) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, name: value } : v)));
  };

  const addDivision = (index: number) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, divisions: [...v.divisions, 0] } : v)));
  };

  const removeDivision = (index: number, divIndex: number) => {
    setVariants(
      variants.map((v, i) =>
        i === index
          ? { ...v, divisions: v.divisions.length > 1 ? v.divisions.filter((_, di) => di !== divIndex) : v.divisions }
          : v
      )
    );
  };

  const updateDivision = (index: number, divIndex: number, value: number) => {
    setVariants(
      variants.map((v, i) =>
        i === index ? { ...v, divisions: v.divisions.map((d, di) => (di === divIndex ? value : d)) } : v
      )
    );
  };

  const divisionsTotal = (divisions: number[]) => divisions.reduce((sum, d) => sum + (Number(d) || 0), 0);

  const saveVariants = async () => {
    if (!productDbId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Save the product first before adding variants.' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('product_variants').delete().eq('product_id', productDbId);
      
      if (variants.length > 0) {
        const toInsert = variants.map((v, i) => {
          const divisions = (v.divisions.length > 0 ? v.divisions : [0]).map((d) => Math.round(Number(d) || 0));
          return {
            product_id: productDbId,
            name: v.name,
            // price = first division (the customer-facing "pay now" price)
            price: divisions[0] || 0,
            price_divisions: divisions,
            order_num: i + 1,
          };
        });
        const { error } = await supabase.from('product_variants').insert(toInsert);
        if (error) throw error;
      }
      
      toast({ title: 'Success', description: 'Variants saved successfully' });
      await fetchVariants();
      // Invalidate all variant caches so storefront reflects changes
      queryClient.invalidateQueries({ queryKey: ['product_variants'] });
      queryClient.invalidateQueries({ queryKey: ['all_product_variants'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to save variants' });
    } finally {
      setLoading(false);
    }
  };

  if (!productDbId) {
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">Save the product first to manage price variants.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Price Variants (Sub-Products)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="h-4 w-4 mr-1" /> Add Variant
        </Button>
      </div>
      
      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground">No variants yet. Add variants like "Early Bird Price", "Installment Price", etc.</p>
      )}

      {variants.map((variant, index) => (
        <div key={index} className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Variant name (e.g. Early Bird)"
            value={variant.name}
            onChange={(e) => updateVariant(index, 'name', e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Price"
            value={variant.price === 0 ? '' : variant.price}
            onChange={(e) => updateVariant(index, 'price', e.target.value ? Number(e.target.value) : 0)}
            className="w-36"
            min="0"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}

      {variants.length > 0 && (
        <Button type="button" onClick={saveVariants} disabled={loading} size="sm">
          {loading ? 'Saving...' : 'Save Variants'}
        </Button>
      )}
    </div>
  );
};
