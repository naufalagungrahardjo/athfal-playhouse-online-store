import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface ProductOption {
  id: string; // db uuid
  product_id: string; // public id like BUMI-D
  name: string;
  price: number;
}

interface VariantOption {
  id: string;
  product_id: string; // db uuid foreign key
  name: string;
  price: number;
}

// A selectable choice = product or product+variant combo
interface Choice {
  key: string; // composite key: productPublicId or productPublicId__variantId
  productPublicId: string;
  variantId?: string;
  displayName: string; // "[Variant] Product" or "Product"
  price: number;
}

interface Props {
  orderId: string;
  items: OrderItem[];
  taxRate?: number;
  currentSubtotal: number;
  currentTax: number;
  currentDiscount: number;
  paymentMethod: string;
  onSaved: () => void;
}

export const OrderItemsEditor = ({
  orderId, items, currentSubtotal, currentTax, currentDiscount, paymentMethod, onSaved,
}: Props) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<OrderItem[]>(items);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [newChoiceKey, setNewChoiceKey] = useState('');
  const [newQty, setNewQty] = useState(1);

  useEffect(() => { setDraft(items); }, [items]);

  useEffect(() => {
    if (!editing) return;
    Promise.all([
      supabase.from('products').select('id, product_id, name, price').order('name'),
      supabase.from('product_variants').select('id, product_id, name, price').order('order_num'),
    ]).then(([p, v]) => {
      setProducts((p.data || []) as ProductOption[]);
      setVariants((v.data || []) as VariantOption[]);
    });
  }, [editing]);

  // Build a flat list of choices: for each product, include the base + any variants
  const choices: Choice[] = useMemo(() => {
    const list: Choice[] = [];
    products.forEach(p => {
      const productVariants = variants.filter(v => v.product_id === p.id);
      // Base product (always selectable)
      list.push({
        key: p.product_id,
        productPublicId: p.product_id,
        displayName: p.name,
        price: p.price,
      });
      productVariants.forEach(v => {
        list.push({
          key: `${p.product_id}__${v.id}`,
          productPublicId: p.product_id,
          variantId: v.id,
          displayName: `[${v.name}] ${p.name}`,
          price: v.price,
        });
      });
    });
    return list;
  }, [products, variants]);

  const taxRate = currentSubtotal > 0 ? currentTax / currentSubtotal : 0;

  const computedSubtotal = draft.reduce((s, i) => s + i.product_price * i.quantity, 0);
  const computedTax = Math.round(computedSubtotal * taxRate);
  const computedTotal = computedSubtotal + computedTax - (currentDiscount || 0);

  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    setDraft(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const removeItem = (idx: number) => {
    setDraft(prev => prev.filter((_, i) => i !== idx));
  };

  const applyChoice = (idx: number, choiceKey: string) => {
    const c = choices.find(x => x.key === choiceKey);
    if (!c) return;
    updateItem(idx, {
      product_id: c.key,
      product_name: c.displayName,
      product_price: c.price,
    });
  };

  const addItem = () => {
    const c = choices.find(x => x.key === newChoiceKey);
    if (!c || newQty < 1) return;
    setDraft(prev => [...prev, {
      id: `new-${Date.now()}`,
      product_id: c.key,
      product_name: c.displayName,
      product_price: c.price,
      quantity: newQty,
    }]);
    setAdding(false);
    setNewChoiceKey('');
    setNewQty(1);
  };

  const handleSave = async () => {
    if (draft.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Order must have at least one item' });
      return;
    }
    try {
      setSaving(true);

      const { error: delErr } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (delErr) throw delErr;

      const insertRows = draft.map(it => ({
        order_id: orderId,
        product_id: it.product_id,
        product_name: it.product_name,
        product_price: it.product_price,
        quantity: it.quantity,
      }));
      const { error: insErr } = await supabase.from('order_items').insert(insertRows);
      if (insErr) throw insErr;

      const { error: updErr } = await supabase.from('orders').update({
        subtotal: computedSubtotal,
        tax_amount: computedTax,
        total_amount: computedTotal,
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);
      if (updErr) throw updErr;

      try {
        await supabase.from('expenses').delete().eq('order_id', orderId);
        await supabase.rpc('create_mdr_expense_for_order' as any, { p_order_id: orderId });
      } catch (mdrErr) {
        console.error('MDR recalculation failed (non-blocking):', mdrErr);
      }

      toast({ title: 'Success', description: 'Order items updated' });
      setEditing(false);
      onSaved();
    } catch (err: any) {
      console.error('Failed to update order items:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to update items' });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Order Items</h3>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit Items
          </Button>
        </div>
        <div className="space-y-3">
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">Product ID: {item.product_id}</p>
                <p className="text-sm text-muted-foreground">Price: {formatCurrency(item.product_price)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Qty: {item.quantity}</p>
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(item.product_price * item.quantity)}</p>
              </div>
            </div>
          )) : <p className="text-muted-foreground italic">No items found for this order</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Edit Order Items</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(items); setAdding(false); }}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Check className="h-3 w-3 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {draft.map((item, i) => {
          const currentKey = item.product_id;
          const matchExists = choices.some(c => c.key === currentKey);
          return (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1 min-w-0">
                <Select value={currentKey} onValueChange={(val) => applyChoice(i, val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    {!matchExists && (
                      <SelectItem value={currentKey}>{item.product_name} (current)</SelectItem>
                    )}
                    {choices.map(c => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.displayName} — {formatCurrency(c.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20"
                />
                <Input
                  type="number"
                  min={0}
                  value={item.product_price}
                  onChange={(e) => updateItem(i, { product_price: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-28"
                />
                <Button size="icon" variant="ghost" onClick={() => removeItem(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}

        {adding ? (
          <div className="flex flex-col sm:flex-row gap-2 p-3 border-2 border-dashed rounded-lg">
            <Select value={newChoiceKey} onValueChange={setNewChoiceKey}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Choose a product or variant..." /></SelectTrigger>
              <SelectContent className="max-h-80">
                {choices.map(c => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.displayName} — {formatCurrency(c.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={1} value={newQty} onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20" />
            <Button size="sm" onClick={addItem} disabled={!newChoiceKey}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewChoiceKey(''); }}>Cancel</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add Product
          </Button>
        )}

        <div className="bg-accent/40 p-3 rounded-lg text-sm space-y-1">
          <div className="flex justify-between"><span>New Subtotal:</span><span>{formatCurrency(computedSubtotal)}</span></div>
          <div className="flex justify-between"><span>New Tax ({(taxRate * 100).toFixed(1)}%):</span><span>{formatCurrency(computedTax)}</span></div>
          {currentDiscount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount:</span><span>-{formatCurrency(currentDiscount)}</span></div>
          )}
          <div className="flex justify-between font-bold"><span>New Total:</span><span>{formatCurrency(computedTotal)}</span></div>
          <p className="text-xs text-muted-foreground pt-1">MDR expense for {paymentMethod} will be recalculated automatically.</p>
        </div>
      </div>
    </div>
  );
};
