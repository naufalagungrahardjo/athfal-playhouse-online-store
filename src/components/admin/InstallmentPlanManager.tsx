import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';

interface PlanRow {
  id?: string;
  name: string;
  num_payments: number;
  payment_amounts: number[]; // length = num_payments - 1 (last stage auto-calculated as remainder)
  order_num: number;
}

interface Props {
  productDbId: string | undefined;
  productPrice: number;
}

export const InstallmentPlanManager = ({ productDbId, productPrice }: Props) => {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (productDbId) fetchRows();
  }, [productDbId]);

  const fetchRows = async () => {
    if (!productDbId) return;
    const { data } = await supabase.from('product_installment_plans' as any).select('*').eq('product_id', productDbId).order('order_num');
    if (data) setRows((data as any[]).map(d => ({
      id: d.id, name: d.name, num_payments: d.num_payments,
      payment_amounts: Array.isArray(d.payment_amounts) ? d.payment_amounts : [],
      order_num: d.order_num,
    })));
  };

  const add = () => setRows([...rows, { name: 'Full Payment', num_payments: 1, payment_amounts: [], order_num: rows.length + 1 }]);
  const remove = async (i: number) => {
    const r = rows[i];
    if (r.id) await supabase.from('product_installment_plans' as any).delete().eq('id', r.id);
    setRows(rows.filter((_, idx) => idx !== i));
  };
  const update = (i: number, field: keyof PlanRow, val: any) => {
    setRows(rows.map((r, idx) => {
      if (idx !== i) return r;
      const next = { ...r, [field]: val };
      if (field === 'num_payments') {
        const n = Math.max(1, Number(val) || 1);
        next.num_payments = n;
        // Resize amounts to (n-1)
        const need = Math.max(0, n - 1);
        const cur = r.payment_amounts.slice(0, need);
        while (cur.length < need) cur.push(0);
        next.payment_amounts = cur;
      }
      return next;
    }));
  };
  const updateAmount = (i: number, idx: number, val: number) => {
    setRows(rows.map((r, ri) => ri === i ? { ...r, payment_amounts: r.payment_amounts.map((a, ai) => ai === idx ? val : a) } : r));
  };

  const save = async () => {
    if (!productDbId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Save the product first.' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('product_installment_plans' as any).delete().eq('product_id', productDbId);
      if (rows.length > 0) {
        const ins = rows.map((r, i) => ({
          product_id: productDbId,
          name: r.name,
          num_payments: r.num_payments,
          payment_amounts: r.payment_amounts,
          order_num: i + 1,
        }));
        const { error } = await supabase.from('product_installment_plans' as any).insert(ins);
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Plans saved' });
      await fetchRows();
      qc.invalidateQueries({ queryKey: ['installment_plans', productDbId] });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!productDbId) {
    return <div className="border rounded-lg p-4 bg-muted/50"><p className="text-sm text-muted-foreground">Save product first to define payment plans.</p></div>;
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Payment Plans (Full / Installment)</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add Plan
        </Button>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Add at least one plan (e.g. "Full Payment" with 1 payment, or "Installment 2x" with 2 payments).</p>}
      {rows.map((r, i) => {
        const sumPredef = r.payment_amounts.reduce((a, b) => a + (b || 0), 0);
        const lastStage = Math.max(0, productPrice - sumPredef);
        return (
          <div key={i} className="border rounded p-3 space-y-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <Input placeholder="Plan name" value={r.name} onChange={e => update(i, 'name', e.target.value)} className="flex-1" />
              <div className="flex items-center gap-1">
                <Label className="text-xs">Payments:</Label>
                <Input type="number" min="1" max="12" value={r.num_payments} onChange={e => update(i, 'num_payments', Number(e.target.value))} className="w-16" />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            {r.num_payments > 1 && (
              <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                {Array.from({ length: r.num_payments - 1 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Label className="text-xs w-24">Payment #{idx + 1}:</Label>
                    <Input type="number" min="0" placeholder="Amount" value={r.payment_amounts[idx] || ''}
                      onChange={e => updateAmount(i, idx, Number(e.target.value) || 0)} className="w-32" />
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Label className="text-xs w-24">Payment #{r.num_payments} (auto):</Label>
                  <span className={lastStage < 0 ? 'text-destructive font-semibold' : 'font-medium'}>{formatCurrency(lastStage)} (remainder)</span>
                </div>
                {sumPredef > productPrice && (
                  <p className="text-xs text-destructive">⚠ Pre-defined amounts exceed product price ({formatCurrency(productPrice)})</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {rows.length > 0 && (
        <Button type="button" onClick={save} disabled={loading} size="sm">{loading ? 'Saving...' : 'Save Plans'}</Button>
      )}
    </div>
  );
};
