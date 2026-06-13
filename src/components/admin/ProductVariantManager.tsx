import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
  quota_limit: number | null;
  quota_sold: number;
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
          quota_limit: (v as any).quota_limit ?? null,
          quota_sold: (v as any).quota_sold ?? 0,
        }))
      );
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', order_num: variants.length + 1, divisions: [0], quota_limit: null, quota_sold: 0 }]);
  };

  const removeVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      await supabase.from('product_variants').delete().eq('id', variant.id);
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const moveVariant = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    setVariants(next.map((v, i) => ({ ...v, order_num: i + 1 })));
  };

  const updateVariantName = (index: number, value: string) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, name: value } : v)));
  };

  const updateVariantQuota = (index: number, value: string) => {
    const parsed = value === '' ? null : Math.max(0, Math.round(Number(value) || 0));
    setVariants(variants.map((v, i) => (i === index ? { ...v, quota_limit: parsed } : v)));
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
      // Preserve existing variant IDs so quota tracking (quota_sold) survives edits.
      const existing = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productDbId);
      const existingIds = new Set((existing.data || []).map((v) => v.id));
      const keptIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string));

      // Delete variants the admin removed.
      const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('product_variants').delete().in('id', toDelete);
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const divisions = (v.divisions.length > 0 ? v.divisions : [0]).map((d) => Math.round(Number(d) || 0));
        const payload: any = {
          product_id: productDbId,
          name: v.name,
          // price = first division (the customer-facing "pay now" price)
          price: divisions[0] || 0,
          price_divisions: divisions,
          order_num: i + 1,
          quota_limit: v.quota_limit,
        };
        if (v.id && existingIds.has(v.id)) {
          const { error } = await supabase.from('product_variants').update(payload).eq('id', v.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('product_variants').insert(payload);
          if (error) throw error;
        }
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
        <div key={index} className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex flex-col flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={index === 0}
                onClick={() => moveVariant(index, 'up')}
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={index === variants.length - 1}
                onClick={() => moveVariant(index, 'down')}
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Sub-product name (e.g. Cicilan 2x)"
              value={variant.name}
              onChange={(e) => updateVariantName(index, e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <div className="space-y-2 pl-7">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Price Divisions (first one is what the customer pays at checkout)</Label>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => addDivision(index)}>
                <Plus className="h-3 w-3 mr-1" /> Add Division
              </Button>
            </div>
            {variant.divisions.map((div, divIndex) => (
              <div key={divIndex} className="flex items-center gap-2">
                <span className="text-xs w-16 text-muted-foreground">
                  {divIndex === 0 ? 'Price 1' : `Price ${divIndex + 1}`}
                </span>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={div === 0 ? '' : div}
                  onChange={(e) => updateDivision(index, divIndex, e.target.value ? Number(e.target.value) : 0)}
                  className="w-40"
                  min="0"
                />
                {divIndex === 0 && <span className="text-xs text-athfal-green">Shown to customer</span>}
                {variant.divisions.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDivision(index, divIndex)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-sm font-medium pt-1">Total: {formatCurrency(divisionsTotal(variant.divisions))}</p>
          </div>

          <div className="space-y-1 pl-7">
            <Label className="text-xs text-muted-foreground">
              Available Quota (leave empty for unlimited)
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                type="number"
                placeholder="Unlimited"
                value={variant.quota_limit ?? ''}
                onChange={(e) => updateVariantQuota(index, e.target.value)}
                className="w-40"
                min="0"
              />
              {variant.quota_limit !== null && variant.quota_limit !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {Math.max(0, variant.quota_limit - (variant.quota_sold || 0))} left
                  {variant.quota_sold > 0 ? ` · ${variant.quota_sold} sold` : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              This limits how many times this variant can be purchased. Main product stock is tracked separately.
            </p>
          </div>
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
