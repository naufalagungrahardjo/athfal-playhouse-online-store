import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Variant {
  id?: string;
  name: string;
  price: number;
  order_num: number;
  stock: number;
  is_sold_out: boolean;
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
      setVariants(data.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        order_num: v.order_num,
        stock: v.stock ?? 0,
        is_sold_out: v.is_sold_out ?? false,
      })));
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', price: 0, order_num: variants.length + 1, stock: 0, is_sold_out: false }]);
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      await supabase.from('product_variants').delete().eq('id', variant.id);
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const saveVariants = async () => {
    if (!productDbId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Save the product first before adding variants.' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('product_variants').delete().eq('product_id', productDbId);
      
      if (variants.length > 0) {
        const toInsert = variants.map((v, i) => ({
          product_id: productDbId,
          name: v.name,
          price: v.price,
          order_num: i + 1,
          stock: v.stock ?? 0,
          is_sold_out: v.is_sold_out ?? false,
        }));
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
