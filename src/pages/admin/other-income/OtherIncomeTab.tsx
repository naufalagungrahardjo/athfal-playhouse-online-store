import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

type FundSource = { id: string; name: string };
type PaymentMethod = { bank_name: string; mdr_rate: number };
type OtherIncome = { id: string; description: string; amount: number; fund_source_id: string | null; date: string };

const OtherIncomeTab = () => {
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fundSourceId, setFundSourceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFund, setEditFund] = useState('');
  const [editDate, setEditDate] = useState('');

  const fetchAll = async () => {
    const [fundsRes, incomeRes, pmRes] = await Promise.all([
      supabase.from('expense_fund_sources' as any).select('id, name'),
      supabase.from('other_income' as any).select('*').order('date', { ascending: false }),
      supabase.from('payment_methods').select('bank_name, mdr_rate'),
    ]);
    setFundSources((fundsRes.data as any) || []);
    setIncomes((incomeRes.data as any) || []);
    setPaymentMethods((pmRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fundMap = Object.fromEntries(fundSources.map(f => [f.id, f.name]));

  const addIncome = async () => {
    if (!description.trim() || !amount) {
      toast.error('Please fill in description and amount');
      return;
    }
    const incomeAmount = parseInt(amount);
    const { error } = await supabase.from('other_income' as any).insert({
      description: description.trim(),
      amount: incomeAmount,
      fund_source_id: fundSourceId || null,
      date,
    } as any);
    if (error) { toast.error(error.message); return; }

    if (fundSourceId) {
      const fundName = fundMap[fundSourceId];
      if (fundName) {
        const pm = paymentMethods.find(p => p.bank_name.toLowerCase() === fundName.toLowerCase());
        if (pm && pm.mdr_rate > 0) {
          const mdrAmount = Math.round((incomeAmount * pm.mdr_rate) / 100);
          if (mdrAmount > 0) {
            let catId: string | null = null;
            const { data: cats } = await supabase.from('expense_categories' as any).select('id').eq('name', 'MDR Fee').limit(1);
            if (cats && cats.length > 0) {
              catId = (cats[0] as any).id;
            } else {
              const { data: newCat } = await supabase.from('expense_categories' as any).insert({ name: 'MDR Fee' } as any).select('id').single();
              if (newCat) catId = (newCat as any).id;
            }
            await supabase.from('expenses' as any).insert({
              description: `MDR - Other Income: ${description.trim()}`,
              amount: mdrAmount,
              category_id: catId,
              fund_source_id: fundSourceId,
              date,
            } as any);
          }
        }
      }
    }

    toast.success('Income added');
    setDescription(''); setAmount(''); setFundSourceId(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    fetchAll();
  };

  const deleteIncome = async (id: string) => {
    await supabase.from('other_income' as any).delete().eq('id', id);
    toast.success('Deleted');
    fetchAll();
  };

  const startEdit = (inc: OtherIncome) => {
    setEditingId(inc.id);
    setEditDesc(inc.description);
    setEditAmount(String(inc.amount));
    setEditFund(inc.fund_source_id || '');
    setEditDate(inc.date);
  };

  const saveEdit = async () => {
    if (!editingId || !editDesc.trim() || !editAmount) return;
    await supabase.from('other_income' as any).update({
      description: editDesc.trim(),
      amount: parseInt(editAmount),
      fund_source_id: editFund || null,
      date: editDate,
      updated_at: new Date().toISOString(),
    } as any).eq('id', editingId);
    setEditingId(null);
    toast.success('Updated');
    fetchAll();
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader><CardTitle>Add Income</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input placeholder="Income details" value={description} onChange={e => setDescription(e.target.value)} />
            <Input type="number" placeholder="Amount (Rp)" value={amount} onChange={e => setAmount(e.target.value)} />
            <Select value={fundSourceId} onValueChange={setFundSourceId}>
              <SelectTrigger><SelectValue placeholder="Fund Destination" /></SelectTrigger>
              <SelectContent>
                {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Button onClick={addIncome}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Income Records</CardTitle></CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No income records yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Fund Destination</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map(inc => (
                  <TableRow key={inc.id}>
                    {editingId === inc.id ? (
                      <>
                        <TableCell><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-36" /></TableCell>
                        <TableCell><Input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></TableCell>
                        <TableCell>
                          <Select value={editFund} onValueChange={setEditFund}>
                            <SelectTrigger><SelectValue placeholder="Fund Destination" /></SelectTrigger>
                            <SelectContent>
                              {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right"><Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-32 ml-auto" /></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{inc.date}</TableCell>
                        <TableCell>{inc.description}</TableCell>
                        <TableCell>{inc.fund_source_id ? fundMap[inc.fund_source_id] || '-' : '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(inc.amount)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(inc)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteIncome(inc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OtherIncomeTab;
