import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Pencil, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type FundSource = { id: string; name: string };
type CapitalInflow = {
  id: string; detail: string; amount: number;
  fund_source_id: string | null; from_fund_source_id: string | null;
  type: string; date: string;
};

const CapitalTab = () => {
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [capitals, setCapitals] = useState<CapitalInflow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [entryType, setEntryType] = useState<'inflow' | 'transfer'>('inflow');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [fundSourceId, setFundSourceId] = useState('');
  const [fromFundSourceId, setFromFundSourceId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetail, setEditDetail] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFund, setEditFund] = useState('');
  const [editFromFund, setEditFromFund] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editType, setEditType] = useState('');

  // Filter
  const [viewFilter, setViewFilter] = useState<'all' | 'inflow' | 'transfer'>('all');

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
      toast.error('Please fill in detail and amount');
      return;
    }
    if (entryType === 'transfer' && !fromFundSourceId) {
      toast.error('Please select source fund for transfer');
      return;
    }
    if (entryType === 'transfer' && fromFundSourceId === fundSourceId) {
      toast.error('Source and destination fund cannot be the same');
      return;
    }
    const { error } = await supabase.from('capital_inflows' as any).insert({
      detail: detail.trim(),
      amount: parseInt(amount),
      fund_source_id: fundSourceId || null,
      from_fund_source_id: entryType === 'transfer' ? fromFundSourceId : null,
      type: entryType,
      date,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(entryType === 'inflow' ? 'Capital inflow added' : 'Fund transfer recorded');
    setDetail(''); setAmount(''); setFundSourceId(''); setFromFundSourceId('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
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
    setEditFromFund(c.from_fund_source_id || '');
    setEditDate(c.date);
    setEditType(c.type || 'inflow');
  };

  const saveEdit = async () => {
    if (!editingId || !editDetail.trim() || !editAmount) return;
    await supabase.from('capital_inflows' as any).update({
      detail: editDetail.trim(),
      amount: parseInt(editAmount),
      fund_source_id: editFund || null,
      from_fund_source_id: editType === 'transfer' ? (editFromFund || null) : null,
      type: editType,
      date: editDate,
      updated_at: new Date().toISOString(),
    } as any).eq('id', editingId);
    setEditingId(null);
    toast.success('Updated');
    fetchAll();
  };

  const filteredCapitals = capitals.filter(c => {
    if (viewFilter === 'all') return true;
    return (c.type || 'inflow') === viewFilter;
  });

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Capital Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={entryType} onValueChange={v => setEntryType(v as 'inflow' | 'transfer')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inflow" className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> New Capital Inflow
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-1.5">
                <ArrowRightLeft className="h-4 w-4" /> Fund Transfer
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={entryType === 'inflow' ? 'Capital detail (e.g. Investor name - purpose)' : 'Transfer detail (e.g. Monthly allocation)'}
              value={detail} onChange={e => setDetail(e.target.value)}
            />
            <Input type="number" placeholder="Amount (Rp)" value={amount} onChange={e => setAmount(e.target.value)} />

            {entryType === 'transfer' && (
              <Select value={fromFundSourceId} onValueChange={setFromFundSourceId}>
                <SelectTrigger><SelectValue placeholder="From Fund (Source)" /></SelectTrigger>
                <SelectContent>
                  {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={fundSourceId} onValueChange={setFundSourceId}>
              <SelectTrigger><SelectValue placeholder={entryType === 'transfer' ? 'To Fund (Destination)' : 'Fund Destination'} /></SelectTrigger>
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
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle>Capital Records</CardTitle>
            <Select value={viewFilter} onValueChange={v => setViewFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="inflow">Inflows Only</SelectItem>
                <SelectItem value="transfer">Transfers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCapitals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No capital records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>From Fund</TableHead>
                    <TableHead>To Fund</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCapitals.map(c => (
                    <TableRow key={c.id}>
                      {editingId === c.id ? (
                        <>
                          <TableCell><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-36" /></TableCell>
                          <TableCell>
                            <Select value={editType} onValueChange={setEditType}>
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inflow">Inflow</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input value={editDetail} onChange={e => setEditDetail(e.target.value)} /></TableCell>
                          <TableCell>
                            {editType === 'transfer' ? (
                              <Select value={editFromFund} onValueChange={setEditFromFund}>
                                <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                                <SelectContent>
                                  {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <Select value={editFund} onValueChange={setEditFund}>
                              <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
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
                          <TableCell>
                            <Badge variant={(c.type || 'inflow') === 'inflow' ? 'default' : 'secondary'}>
                              {(c.type || 'inflow') === 'inflow' ? 'Inflow' : 'Transfer'}
                            </Badge>
                          </TableCell>
                          <TableCell>{c.detail}</TableCell>
                          <TableCell>{c.from_fund_source_id ? fundMap[c.from_fund_source_id] || '-' : '-'}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalTab;
