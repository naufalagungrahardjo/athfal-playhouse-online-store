import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type Product = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  tax: number;
};
type Variant = { id: string; product_id: string; name: string; price: number };
type PaymentMethod = { id: string; bank_name: string; active: boolean };

type LineItem = {
  productDbId: string;
  variantId: string | null;
  quantity: number;
};

const ManualOrderTab = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, Variant[]>>({});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [guardianStatus, setGuardianStatus] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [childGender, setChildGender] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productDbId: '', variantId: null, quantity: 1 }]);

  const childAge = useMemo(() => {
    if (!childBirthdate) return '';
    const birth = new Date(childBirthdate);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }
    if (years < 0) return '';
    return `${years} tahun ${months} bulan`;
  }, [childBirthdate]);

  useEffect(() => {
    (async () => {
      const [prodRes, varRes, pmRes] = await Promise.all([
        supabase.from('products').select('id, product_id, name, price, tax').order('name'),
        supabase.from('product_variants').select('*').order('order_num'),
        supabase.from('payment_methods').select('id, bank_name, active').eq('active', true).order('bank_name'),
      ]);
      setProducts((prodRes.data as any) || []);
      const map: Record<string, Variant[]> = {};
      ((varRes.data as any) || []).forEach((v: Variant) => {
        if (!map[v.product_id]) map[v.product_id] = [];
        map[v.product_id].push(v);
      });
      setVariantsByProduct(map);
      setPaymentMethods((pmRes.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems(prev => [...prev, { productDbId: '', variantId: null, quantity: 1 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const computeLine = (item: LineItem) => {
    const product = products.find(p => p.id === item.productDbId);
    if (!product) return { unitPrice: 0, subtotal: 0, tax: 0, name: '', baseId: '', taxRate: 0 };
    const variants = variantsByProduct[product.id] || [];
    const variant = variants.find(v => v.id === item.variantId);
    const unitPrice = variant ? variant.price : product.price;
    const subtotal = unitPrice * item.quantity;
    const taxRate = product.tax || 0;
    const tax = Math.round((subtotal * taxRate) / 100);
    const baseId = variant ? `${product.product_id}__${variant.id}` : product.product_id;
    const name = variant ? `${product.name} - ${variant.name}` : product.name;
    return { unitPrice, subtotal, tax, name, baseId, taxRate };
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    items.forEach(it => {
      const line = computeLine(it);
      subtotal += line.subtotal;
      tax += line.tax;
    });
    return { subtotal, tax, total: subtotal + tax };
  }, [items, products, variantsByProduct]);

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      toast.error('Please fill customer name, email and phone');
      return;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    const validItems = items.filter(it => it.productDbId && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setSubmitting(true);
    try {
      const orderId = crypto.randomUUID();
      const orderItems = validItems.map(it => {
        const line = computeLine(it);
        return {
          order_id: orderId,
          product_id: line.baseId,
          product_name: line.name,
          product_price: line.unitPrice,
          quantity: it.quantity,
        };
      });

      const { error: orderErr } = await supabase.from('orders').insert({
        id: orderId,
        user_id: null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim() || null,
        guardian_status: guardianStatus.trim() || null,
        child_name: childName.trim() || null,
        child_birthdate: childBirthdate || null,
        child_age: childAge || null,
        child_gender: childGender || null,
        payment_method: paymentMethod,
        notes: notes.trim() ? `[Manual Order] ${notes.trim()}` : '[Manual Order]',
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        status: 'completed',
        stock_deducted: true, // skip stock deduction (allow regardless of stock)
      });

      if (orderErr) {
        toast.error(`Failed to create order: ${orderErr.message}`);
        setSubmitting(false);
        return;
      }

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) {
        toast.error(`Order created but items failed: ${itemsErr.message}`);
        setSubmitting(false);
        return;
      }

      // Auto-create MDR expense
      try {
        await supabase.rpc('create_mdr_expense_for_order' as any, { p_order_id: orderId });
      } catch (e) {
        // non-blocking
      }

      toast.success(`Manual order created (#${orderId.slice(0, 8)})`);
      // Reset form
      setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerAddress('');
      setGuardianStatus(''); setChildName(''); setChildBirthdate(''); setChildGender('');
      setPaymentMethod(''); setNotes('');
      setItems([{ productDbId: '', variantId: null, quantity: 1 }]);
    } catch (e: any) {
      toast.error(e.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Customer Name *</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
          <div><Label>Email *</Label><Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></div>
          <div><Label>Phone *</Label><Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} rows={2} /></div>
          <div>
            <Label>Status Wali</Label>
            <Input value={guardianStatus} onChange={e => setGuardianStatus(e.target.value)} placeholder="Contoh: Orang tua, Wali, Kakek/Nenek, dll." />
          </div>
          <div>
            <Label>Nama Anak</Label>
            <Input value={childName} onChange={e => setChildName(e.target.value)} placeholder="Isi jika produk untuk anak" />
          </div>
          <div>
            <Label>Jenis Kelamin Anak</Label>
            <RadioGroup value={childGender} onValueChange={setChildGender} className="flex gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boy" id="manual-gender-boy" />
                <Label htmlFor="manual-gender-boy" className="font-normal cursor-pointer">Laki-laki</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="girl" id="manual-gender-girl" />
                <Label htmlFor="manual-gender-girl" className="font-normal cursor-pointer">Perempuan</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label>Tanggal Lahir Anak</Label>
            <Input
              type="date"
              value={childBirthdate}
              onChange={e => setChildBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label>Usia Anak</Label>
            <Input value={childAge} readOnly className="bg-muted cursor-not-allowed" placeholder="Otomatis dari tanggal lahir" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => {
            const product = products.find(p => p.id === item.productDbId);
            const variants = product ? variantsByProduct[product.id] || [] : [];
            const line = computeLine(item);
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-md">
                <div className="md:col-span-5">
                  <Label className="text-xs">Product</Label>
                  <Select value={item.productDbId} onValueChange={val => updateItem(idx, { productDbId: val, variantId: null })}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-xs">Variant</Label>
                  <Select
                    value={item.variantId || 'none'}
                    onValueChange={val => updateItem(idx, { variantId: val === 'none' ? null : val })}
                    disabled={variants.length === 0}
                  >
                    <SelectTrigger><SelectValue placeholder={variants.length === 0 ? 'No variants' : 'Select variant'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Default —</SelectItem>
                      {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({formatCurrency(v.price)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} />
                </div>
                <div className="md:col-span-1 text-right text-sm">
                  <div className="text-muted-foreground text-xs">Subtotal</div>
                  <div className="font-medium">{formatCurrency(line.subtotal)}</div>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
          <Button variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment & Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.bank_name}>{pm.bank_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">MDR fee will be auto-applied to expenses if configured for this method.</p>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(totals.tax)}</span></div>
          <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
          <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating Order...' : 'Create Manual Order'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualOrderTab;
