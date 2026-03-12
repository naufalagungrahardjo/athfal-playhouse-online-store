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
type CapitalInflow = { id: string; detail: string; amount: number; fund_source_id: string | null; date: string };

const CapitalTab = () => {
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [capitals, setCapitals] = useState<CapitalInflow[]>([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [fundSourceId, setFundSourceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetail, setEditDetail] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFund, setEditFund] = useState('');
  const [editDate, setEditDate] = useState('');

  const fetchAll = async () => {
    const [fundsRes, capitalRes] = await Promise.all([
      supabase.from('expense_fund_sources' as any).select('id, name'),
      supabase.from('capital_inflows' as any).select('*').order('date', { ascending: false }),
    ]);
    setFundSources((fundsRes.data as any) || []);
    setCapitals((capitalRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fundMap = Object.fromEntries(fundSources.map(f => [f.id, f.name]));

  const addCapital = async () => {
    if (!detail.trim() || !amount) {
      toast.error('Please fill in capital detail and amount');
      return;
    }
    const { error } = await supabase.from('capital_inflows' as any).insert({
      detail: detail.trim(),
      amount: parseInt(amount),
      fund_source_id: fundSourceId || null,
      date,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Capital added');
    setDetail(''); setAmount(''); setFundSourceId(''); setDate(format(new Date(), 'yyyy-MM-dd'));
    fetchAll();
  };

  const deleteCapital = async (id: string) => {
    await supabase.from('capital_inflows' as any).delete().eq('id', id);
    toast.success('Deleted');
    fetchAll();
  };

  const startEdit = (c: CapitalInflow) => {
    setEditingId(c.id);
    setEditDetail(c.detail);
    setEditAmount(String(c.amount));
    setEditFund(c.fund_source_id || '');
    setEditDate(c.date);
  };

  const saveEdit = async () => {
    if (!editingId || !editDetail.trim() || !editAmount) return;
    await supabase.from('capital_inflows' as any).update({
      detail: editDetail.trim(),
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
        <CardHeader><CardTitle>Add Capital Inflow</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input placeholder="Capital detail (e.g. Investor name - purpose)" value={detail} onChange={e => setDetail(e.target.value)} />
            <Input type="number" placeholder="Amount (Rp)" value={amount} onChange={e => setAmount(e.target.value)} />
            <Select value={fundSourceId} onValueChange={setFundSourceId}>
              <SelectTrigger><SelectValue placeholder="Fund Destination" /></SelectTrigger>
              <SelectContent>
                {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Button onClick={addCapital}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Capital Records</CardTitle></CardHeader>
        <CardContent>
          {capitals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No capital records yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Capital Detail</TableHead>
                  <TableHead>Fund Destination</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capitals.map(c => (
                  <TableRow key={c.id}>
                    {editingId === c.id ? (
                      <>
                        <TableCell><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-36" /></TableCell>
                        <TableCell><Input value={editDetail} onChange={e => setEditDetail(e.target.value)} /></TableCell>
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
                        <TableCell>{c.date}</TableCell>
                        <TableCell>{c.detail}</TableCell>
                        <TableCell>{c.fund_source_id ? fundMap[c.fund_source_id] || '-' : '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteCapital(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default CapitalTab;
