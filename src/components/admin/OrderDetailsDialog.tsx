
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { OrderItemsEditor } from './orders/OrderItemsEditor';
import { Input } from '@/components/ui/input';
import { getPaymentStatus, getPayable, getPaymentStatusColor, getPaymentStatusLabel } from '@/lib/paymentStatus';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminRole } from '@/pages/admin/helpers/getAdminRole';
import { Textarea } from '@/components/ui/textarea';
import { OrderBillingNoticesSection } from './billing/OrderBillingNoticesSection';
import { Switch } from '@/components/ui/switch';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  installment_plan_name?: string | null;
  session_name?: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address?: string;
  guardian_status?: string | null;
  child_name?: string | null;
  child_age?: string | null;
  child_birthdate?: string | null;
  child_gender?: string | null;
  payment_method: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid?: number;
  promo_code?: string;
  discount_amount?: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const OrderDetailsDialog = ({ order, isOpen, onClose, onOrderUpdated }: OrderDetailsDialogProps) => {
  const [status, setStatus] = useState(order?.status || 'pending');
  const [updating, setUpdating] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || '');
  const [paymentMethods, setPaymentMethods] = useState<{id: string; bank_name: string}[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(order?.amount_paid || 0);
  const [savingPayment, setSavingPayment] = useState(false);
  const [childGender, setChildGender] = useState<string>(order?.child_gender || '');
  const [savingGender, setSavingGender] = useState(false);
  const [payments, setPayments] = useState<Array<{ id: string; payment_number: number; amount: number; status: string; paid_at: string | null; created_at: string; notes: string | null; evidence_url: string | null }>>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [togglingPaymentId, setTogglingPaymentId] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = getAdminRole(user) === 'super_admin';

  // Editable customer fields (super_admin only)
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>('');
  const [savingField, setSavingField] = useState(false);

  const startEditField = (field: string, current: any) => {
    setEditingField(field);
    setFieldValue(current == null ? '' : String(current));
  };

  const cancelEditField = () => {
    setEditingField(null);
    setFieldValue('');
  };

  const saveField = async (field: string) => {
    if (!order) return;
    try {
      setSavingField(true);
      const payload: any = { updated_at: new Date().toISOString() };
      payload[field] = fieldValue.trim() === '' ? null : fieldValue;
      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Customer info updated' });
      setEditingField(null);
      onOrderUpdated();
    } catch (error: any) {
      console.error('Error updating field:', error);
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to update' });
    } finally {
      setSavingField(false);
    }
  };

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentMethod(order.payment_method);
      setAmountPaid(order.amount_paid || 0);
      setChildGender(order.child_gender || '');
    }
  }, [order]);

  useEffect(() => {
    if (editingPayment) {
      supabase.from('payment_methods').select('id, bank_name').eq('active', true)
        .then(({ data }) => setPaymentMethods(data || []));
    }
  }, [editingPayment]);

  useEffect(() => {
    if (!order?.id || !isOpen) return;
    setLoadingPayments(true);
    supabase
      .from('order_payments')
      .select('id, payment_number, amount, status, paid_at, created_at, notes, evidence_url')
      .eq('order_id', order.id)
      .order('payment_number', { ascending: true })
      .then(({ data }) => {
        setPayments(data || []);
        setLoadingPayments(false);
      });
  }, [order?.id, isOpen, amountPaid]);

  const handlePaymentMethodUpdate = async () => {
    if (!order || paymentMethod === order.payment_method) return;
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('orders')
        .update({ payment_method: paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: "Success", description: "Payment method updated successfully" });
      setEditingPayment(false);
      onOrderUpdated();
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update payment method" });
    } finally {
      setUpdating(false);
    }
  };

  const handleAmountPaidSave = async () => {
    if (!order) return;
    const safeValue = Math.max(0, Math.floor(amountPaid || 0));
    const currentPaid = order.amount_paid || 0;
    const delta = safeValue - currentPaid;
    if (delta === 0) return;
    try {
      setSavingPayment(true);

      // Get next payment_number
      const { data: maxRow } = await supabase
        .from('order_payments')
        .select('payment_number')
        .eq('order_id', order.id)
        .order('payment_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextNumber = (maxRow?.payment_number || 0) + 1;

      const note = delta > 0
        ? 'Manual payment recorded by admin'
        : 'Manual adjustment by admin';

      const { error } = await supabase
        .from('order_payments')
        .insert({
          order_id: order.id,
          payment_number: nextNumber,
          amount: delta, // can be negative for downward adjustment
          status: 'paid',
          paid_at: new Date().toISOString(),
          notes: note,
        });
      if (error) throw error;

      // Trigger sync_order_amount_paid will update orders.amount_paid
      toast({ title: 'Success', description: 'Payment recorded' });
      onOrderUpdated();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to record payment' });
    } finally {
      setSavingPayment(false);
    }
  };

  const applyPaymentDivision = async (
    paymentId: string,
    newStatus: 'paid' | 'unpaid',
    evidenceUrl?: string,
  ) => {
    if (!order) return;
    try {
      setTogglingPaymentId(paymentId);
      const updatePayload: any = {
        status: newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (evidenceUrl !== undefined) updatePayload.evidence_url = evidenceUrl;
      const { error } = await supabase
        .from('order_payments')
        .update(updatePayload)
        .eq('id', paymentId);
      if (error) throw error;
      // Refresh local payments + order (sync_order_amount_paid trigger updates amount_paid)
      const updatedPayments = payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: newStatus,
              paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
              evidence_url: evidenceUrl !== undefined ? evidenceUrl : p.evidence_url,
            }
          : p,
      );
      setPayments(updatedPayments);
      // Recompute the amount paid locally so Payable (Outstanding) updates immediately
      const newAmountPaid = updatedPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      setAmountPaid(newAmountPaid);
      toast({ title: 'Success', description: `Payment marked as ${newStatus === 'paid' ? 'paid' : 'unpaid'}` });
      onOrderUpdated();
    } catch (error: any) {
      console.error('Error toggling payment division:', error);
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to update payment' });
    } finally {
      setTogglingPaymentId(null);
    }
  };

  const handlePaymentSwitch = (paymentId: string, checked: boolean) => {
    if (checked) {
      // Require evidence upload before marking as paid
      setPendingPaymentId(paymentId);
      evidenceInputRef.current?.click();
    } else {
      applyPaymentDivision(paymentId, 'unpaid');
    }
  };

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const paymentId = pendingPaymentId;
    setPendingPaymentId(null);
    if (!file || !paymentId || !order) return;
    try {
      setUploadingEvidenceId(paymentId);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `payment-evidence/${order.id}/${paymentId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true, cacheControl: '31536000', contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      await applyPaymentDivision(paymentId, 'paid', publicUrl);
    } catch (error: any) {
      console.error('Error uploading payment evidence:', error);
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to upload evidence' });
    } finally {
      setUploadingEvidenceId(null);
    }
  };

  const handleChildGenderSave = async (newGender: string) => {
    if (!order) return;
    try {
      setSavingGender(true);
      setChildGender(newGender);
      const { error } = await supabase
        .from('orders')
        .update({ child_gender: newGender || null, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Child gender updated' });
      onOrderUpdated();
    } catch (error) {
      console.error('Error updating child gender:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update child gender' });
    } finally {
      setSavingGender(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);

      // If cancelling, restore stock via RPC
      if (status === 'cancelled') {
        const { error: restoreError } = await supabase
          .rpc('restore_stock_for_order', { p_order_id: order.id });

        if (restoreError) {
          console.error('Stock restoration failed:', restoreError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to restore stock for cancelled order',
          });
          return;
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });

      onOrderUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!order) return null;

  // Map each payment division to the installment plan of the order item it belongs to.
  // Payments are stored sequentially per item, with the per-item "Pembayaran N" index
  // resetting to 1 whenever a new item's divisions begin.
  const planByPaymentId = (() => {
    const map: Record<string, string> = {};
    const orderItems = order.items || [];
    const sorted = [...payments].sort((a, b) => a.payment_number - b.payment_number);
    let itemIdx = -1;
    for (const p of sorted) {
      const match = p.notes?.match(/Pembayaran\s+(\d+)/i);
      const idx = match ? parseInt(match[1], 10) : 1;
      if (idx === 1) itemIdx++;
      const plan = orderItems[itemIdx]?.installment_plan_name;
      if (plan) map[p.id] = plan;
    }
    return map;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.id}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              {(['customer_name','customer_email','customer_phone'] as const).map((f) => {
                const labels: Record<string,string> = {
                  customer_name: 'Name',
                  customer_email: 'Email',
                  customer_phone: 'Phone',
                };
                const val = (order as any)[f];
                return (
                  <div key={f}>
                    <label className="text-sm font-medium text-gray-500">{labels[f]}</label>
                    {editingField === f ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button size="sm" onClick={() => saveField(f)} disabled={savingField}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{val || <span className="text-gray-400 italic">— Not set —</span>}</p>
                        {isSuperAdmin && (
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField(f, val)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                {editingPayment ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Keep current value as option */}
                        {!paymentMethods.find(pm => pm.bank_name === order.payment_method) && (
                          <SelectItem value={order.payment_method}>{order.payment_method}</SelectItem>
                        )}
                        {paymentMethods.map(pm => (
                          <SelectItem key={pm.id} value={pm.bank_name}>{pm.bank_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handlePaymentMethodUpdate} disabled={updating || paymentMethod === order.payment_method}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingPayment(false); setPaymentMethod(order.payment_method); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.payment_method}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPayment(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {/* Address (always shown) */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                {editingField === 'customer_address' ? (
                  <div className="flex items-start gap-2 mt-1">
                    <Textarea
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      rows={2}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => saveField('customer_address')} disabled={savingField}>Save</Button>
                      <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.customer_address || <span className="text-gray-400 italic">— Not set —</span>}</p>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField('customer_address', order.customer_address)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Guardian Status (always shown) */}
              <div>
                <label className="text-sm font-medium text-gray-500">Guardian Status</label>
                {editingField === 'guardian_status' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} className="max-w-xs" placeholder="e.g. Bunda, Ayah" />
                    <Button size="sm" onClick={() => saveField('guardian_status')} disabled={savingField}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.guardian_status || <span className="text-gray-400 italic">— Not set —</span>}</p>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField('guardian_status', order.guardian_status)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Child Name (always shown) */}
              <div>
                <label className="text-sm font-medium text-gray-500">Child Name</label>
                {editingField === 'child_name' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={() => saveField('child_name')} disabled={savingField}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.child_name || <span className="text-gray-400 italic">— Not set —</span>}</p>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField('child_name', order.child_name)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Child Birthdate (always shown) */}
              <div>
                <label className="text-sm font-medium text-gray-500">Child Birthdate</label>
                {editingField === 'child_birthdate' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="date" value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={() => saveField('child_birthdate')} disabled={savingField}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.child_birthdate ? new Date(order.child_birthdate).toLocaleDateString() : <span className="text-gray-400 italic">— Not set —</span>}</p>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField('child_birthdate', order.child_birthdate ? String(order.child_birthdate).slice(0,10) : '')}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Child Age (always shown) */}
              <div>
                <label className="text-sm font-medium text-gray-500">Child Age</label>
                {editingField === 'child_age' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={() => saveField('child_age')} disabled={savingField}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEditField}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{order.child_age || <span className="text-gray-400 italic">— Not set —</span>}</p>
                    {isSuperAdmin && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditField('child_age', order.child_age)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Child Gender</label>
                <Select
                  value={childGender || 'unset'}
                  onValueChange={(v) => handleChildGenderSave(v === 'unset' ? '' : v)}
                  disabled={savingGender || !isSuperAdmin}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">— Not set —</SelectItem>
                    <SelectItem value="boy">Boy</SelectItem>
                    <SelectItem value="girl">Girl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <OrderItemsEditor
            orderId={order.id}
            items={order.items || []}
            currentSubtotal={order.subtotal}
            currentTax={order.tax_amount}
            currentDiscount={order.discount_amount || 0}
            paymentMethod={order.payment_method}
            onSaved={onOrderUpdated}
          />

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.promo_code && order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.promo_code}):</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Tracking */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Payment Tracking
              <Badge className={getPaymentStatusColor(getPaymentStatus(order.amount_paid, order.total_amount))}>
                {getPaymentStatusLabel(getPaymentStatus(order.amount_paid, order.total_amount))}
              </Badge>
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Amount Paid (IDR)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleAmountPaidSave}
                    disabled={savingPayment || amountPaid === (order.amount_paid || 0)}
                  >
                    {savingPayment ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountPaid(order.total_amount)}
                    disabled={savingPayment}
                  >
                    Mark Fully Paid
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Payable (Outstanding):</span>
                <span className={getPayable(amountPaid, order.total_amount) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(getPayable(amountPaid, order.total_amount))}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Analytics revenue reflects only the amount paid. Outstanding balance shows as receivable.
              </p>

              {/* Payment History */}
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                {loadingPayments ? (
                  <p className="text-xs text-gray-500">Loading...</p>
                ) : payments.filter(p => p.status === 'paid').length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No payments recorded yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {payments
                      .filter(p => p.status === 'paid')
                      .map((p) => (
                        <li key={p.id} className="flex justify-between text-sm bg-white border rounded px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium">Payment #{p.payment_number}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(p.paid_at || p.created_at).toLocaleString()}
                            </span>
                            {p.notes && <span className="text-xs text-gray-500 italic">{p.notes}</span>}
                          </div>
                          <span className="font-semibold text-green-700">{formatCurrency(p.amount)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Payment Divisions (installment toggles) */}
          <input
            ref={evidenceInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleEvidenceFileChange}
          />
          {payments.length > 0 && (() => {
            const discountRatio = order.subtotal > 0 ? (order.discount_amount || 0) / order.subtotal : 0;
            const hasDiscount = discountRatio > 0.0001;
            const discountPct = Math.round(discountRatio * 100);
            const outstanding = getPayable(amountPaid, order.total_amount);
            return (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Payment Divisions</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Toggle each division when the customer pays it. Paid divisions immediately count as revenue
                    (except for refunded/cancelled orders).
                    {hasDiscount && ` A ${discountPct}% discount applies to every division.`}
                  </p>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Item</th>
                          <th className="text-right font-medium px-3 py-2">Price</th>
                          {hasDiscount && <th className="text-right font-medium px-3 py-2">Discount</th>}
                          <th className="text-right font-medium px-3 py-2">Total Price</th>
                          <th className="text-center font-medium px-3 py-2">Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => {
                          const total = p.amount;
                          const original = hasDiscount ? Math.round(p.amount / (1 - discountRatio)) : p.amount;
                          return (
                            <tr key={p.id} className="border-t">
                              <td className="px-3 py-2">
                                <span className="font-medium">{p.notes || `Pembayaran ${p.payment_number}`}</span>
                                {planByPaymentId[p.id] && (
                                  <span className="block text-xs text-athfal-green font-medium">
                                    Plan: {planByPaymentId[p.id]}
                                  </span>
                                )}
                                {p.status === 'paid' && p.paid_at && (
                                  <span className="block text-xs text-gray-500">
                                    Paid: {new Date(p.paid_at).toLocaleString()}
                                  </span>
                                )}
                                {p.evidence_url && (
                                  <a
                                    href={p.evidence_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs text-blue-600 hover:underline mt-0.5"
                                  >
                                    View payment evidence
                                  </a>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(original)}</td>
                              {hasDiscount && (
                                <td className="px-3 py-2 text-right whitespace-nowrap text-green-600">{discountPct}%</td>
                              )}
                              <td className="px-3 py-2 text-right whitespace-nowrap font-semibold">{formatCurrency(total)}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={p.status === 'paid'}
                                    disabled={togglingPaymentId === p.id || uploadingEvidenceId === p.id}
                                    onCheckedChange={(checked) => handlePaymentSwitch(p.id, checked)}
                                  />
                                  {uploadingEvidenceId === p.id && (
                                    <span className="text-xs text-gray-500">Uploading…</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 bg-gray-50 rounded p-3 space-y-1 text-sm">
                    {hasDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discountPct}%):</span>
                        <span>-{formatCurrency(order.discount_amount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total payable after discount:</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Outstanding after discount:</span>
                      <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(outstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Order Management */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Management</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 block mb-2">Update Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={updating || status === order.status}
                className="mt-6"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Billing Notices */}
          <OrderBillingNoticesSection order={order} />

          {/* Order Meta */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>Order ID: {order.id}</p>
            <p>Created: {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
