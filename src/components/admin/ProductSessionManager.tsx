import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SessionRow {
  id?: string;
  name: string;
  stock: number;
  is_sold_out: boolean;
  order_num: number;
}

interface Props {
  productDbId: string | undefined;
}

export const ProductSessionManager = ({ productDbId }: Props) => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (productDbId) fetchRows();
  }, [productDbId]);

  const fetchRows = async () => {
    if (!productDbId) return;
    const { data } = await supabase.from('product_sessions' as any).select('*').eq('product_id', productDbId).order('order_num');
    if (data) setRows((data as any[]).map(d => ({ id: d.id, name: d.name, stock: d.stock, is_sold_out: d.is_sold_out, order_num: d.order_num })));
  };

  const add = () => setRows([...rows, { name: '', stock: 0, is_sold_out: false, order_num: rows.length + 1 }]);
  const remove = async (i: number) => {
    const r = rows[i];
    if (r.id) await supabase.from('product_sessions' as any).delete().eq('id', r.id);
    setRows(rows.filter((_, idx) => idx !== i));
  };
  const update = (i: number, field: keyof SessionRow, val: any) => setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const save = async () => {
    if (!productDbId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Save the product first.' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('product_sessions' as any).delete().eq('product_id', productDbId);
      if (rows.length > 0) {
        const ins = rows.map((r, i) => ({
          product_id: productDbId,
          name: r.name,
          stock: r.stock,
          is_sold_out: r.is_sold_out,
          order_num: i + 1,
        }));
        const { error } = await supabase.from('product_sessions' as any).insert(ins);
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Sessions saved' });
      await fetchRows();
      qc.invalidateQueries({ queryKey: ['product_sessions', productDbId] });
      qc.invalidateQueries({ queryKey: ['all_product_sessions'] });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!productDbId) {
    return <div className="border rounded-lg p-4 bg-muted/50"><p className="text-sm text-muted-foreground">Save product first to manage sessions.</p></div>;
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Session Times (e.g. Pagi, Siang, Sore)</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add Session
        </Button>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet. Each session has its own stock.</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input placeholder="Session name (e.g. Pagi)" value={r.name} onChange={e => update(i, 'name', e.target.value)} className="flex-1" />
          <Input type="number" placeholder="Stock" value={r.stock === 0 ? '' : r.stock} onChange={e => update(i, 'stock', e.target.value ? Number(e.target.value) : 0)} className="w-24" min="0" />
          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
            <input type="checkbox" checked={r.is_sold_out} onChange={e => update(i, 'is_sold_out', e.target.checked)} />
            Sold out
          </label>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      {rows.length > 0 && (
        <Button type="button" onClick={save} disabled={loading} size="sm">{loading ? 'Saving...' : 'Save Sessions'}</Button>
      )}
    </div>
  );
};
