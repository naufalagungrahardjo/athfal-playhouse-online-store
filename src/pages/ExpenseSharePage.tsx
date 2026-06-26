import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

type Option = { id: string; name: string };
type ShareExpense = {
  id: string;
  description: string;
  category_id: string | null;
  fund_source_id: string | null;
  amount: number;
  discount: number;
  date: string;
  created_at: string;
};

const ExpenseSharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [categories, setCategories] = useState<Option[]>([]);
  const [fundSources, setFundSources] = useState<Option[]>([]);
  const [expenses, setExpenses] = useState<ShareExpense[]>([]);

  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState('');
  const [fundId, setFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    if (!token) { setInvalid(true); setLoading(false); return; }
    const { data, error } = await supabase.rpc('get_expense_share_data', { p_token: token } as any);
    if (error || !data) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    const d = data as any;
    setCategories(d.categories || []);
    setFundSources(d.fund_sources || []);
    setExpenses(d.expenses || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [token]);

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);
  const fundMap = useMemo(() => Object.fromEntries(fundSources.map(f => [f.id, f.name])), [fundSources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(exp => {
      const cat = (exp.category_id ? catMap[exp.category_id] || '' : '').toLowerCase();
      const fund = (exp.fund_source_id ? fundMap[exp.fund_source_id] || '' : '').toLowerCase();
      const fields = [exp.description, cat, fund, String(exp.amount), exp.date];
      return fields.some(v => v != null && String(v).toLowerCase().includes(q));
    });
  }, [expenses, search, catMap, fundMap]);

  const totals = useMemo(() => filtered.reduce(
    (acc, e) => {
      acc.amount += e.amount || 0;
      acc.discount += e.discount || 0;
      acc.final += (e.amount || 0) - (e.discount || 0);
      return acc;
    },
    { amount: 0, discount: 0, final: 0 }
  ), [filtered]);

  const submit = async () => {
    if (!desc.trim() || !amount) {
      toast({ title: 'Please fill description and amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('add_expense_via_share', {
      p_token: token,
      p_description: desc.trim(),
      p_amount: parseInt(amount),
      p_category_id: catId || null,
      p_fund_source_id: fundId || null,
      p_discount: parseInt(discount) || 0,
      p_date: date,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Expense added' });
    setDesc(''); setCatId(''); setFundId(''); setAmount(''); setDiscount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    loadData();
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  }

  if (invalid) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <h1 className="text-2xl font-bold">Link not available</h1>
        <p className="text-muted-foreground">
          This expense link is invalid or has been disabled. Please ask the administrator for a new link.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Expense Entry</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        You can add expenses and view recorded expenses through this private link. Keep it confidential.
      </p>

      <Card>
        <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium block mb-1">Description</label>
              <Textarea placeholder="Details of expense..." value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Category</label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Amount (Rp)</label>
              <Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Discount (Rp)</label>
              <Input type="number" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Fund Source</label>
              <Select value={fundId} onValueChange={setFundId}>
                <SelectTrigger><SelectValue placeholder="Select fund source" /></SelectTrigger>
                <SelectContent>
                  {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={submit} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" /> {saving ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Expense Records</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match your search'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Fund Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Final Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(exp => (
                  <TableRow key={exp.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(exp.date), 'EEE, d MMM yyyy')}</TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">{exp.description}</div>
                    </TableCell>
                    <TableCell>{exp.category_id ? catMap[exp.category_id] || '-' : '-'}</TableCell>
                    <TableCell>{exp.fund_source_id ? fundMap[exp.fund_source_id] || '-' : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(exp.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(exp.discount || 0)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(exp.amount - (exp.discount || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Total ({filtered.length})</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totals.amount)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totals.discount)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totals.final)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseSharePage;