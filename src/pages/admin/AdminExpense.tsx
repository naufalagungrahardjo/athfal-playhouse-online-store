import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

type ExpenseCategory = { id: string; name: string };
type FundSource = { id: string; name: string };
type Expense = {
  id: string;
  description: string;
  category_id: string | null;
  fund_source_id: string | null;
  amount: number;
  date: string;
  created_at: string;
};

const AdminExpense = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [newFundName, setNewFundName] = useState('');
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [editingFundName, setEditingFundName] = useState('');

  // Expense form
  const [expDesc, setExpDesc] = useState('');
  const [expCatId, setExpCatId] = useState('');
  const [expFundId, setExpFundId] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [catsRes, fundsRes, expRes] = await Promise.all([
      supabase.from('expense_categories' as any).select('id, name').order('name'),
      supabase.from('expense_fund_sources' as any).select('id, name').order('name'),
      supabase.from('expenses' as any).select('*').order('date', { ascending: false }),
    ]);
    setCategories((catsRes.data as any) || []);
    setFundSources((fundsRes.data as any) || []);
    setExpenses((expRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Category CRUD
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('expense_categories' as any).insert({ name: newCatName.trim() } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewCatName('');
    toast({ title: 'Category added' });
    fetchAll();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('expense_categories' as any).delete().eq('id', id);
    toast({ title: 'Category deleted' });
    fetchAll();
  };

  const startEditCat = (cat: ExpenseCategory) => { setEditingCatId(cat.id); setEditingCatName(cat.name); };
  const saveEditCat = async () => {
    if (!editingCatId || !editingCatName.trim()) return;
    await supabase.from('expense_categories' as any).update({ name: editingCatName.trim(), updated_at: new Date().toISOString() } as any).eq('id', editingCatId);
    setEditingCatId(null); setEditingCatName('');
    toast({ title: 'Category updated' });
    fetchAll();
  };

  // Fund source CRUD
  const addFundSource = async () => {
    if (!newFundName.trim()) return;
    const { error } = await supabase.from('expense_fund_sources' as any).insert({ name: newFundName.trim() } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewFundName('');
    toast({ title: 'Fund source added' });
    fetchAll();
  };

  const deleteFundSource = async (id: string) => {
    await supabase.from('expense_fund_sources' as any).delete().eq('id', id);
    toast({ title: 'Fund source deleted' });
    fetchAll();
  };

  const startEditFund = (fund: FundSource) => { setEditingFundId(fund.id); setEditingFundName(fund.name); };
  const saveEditFund = async () => {
    if (!editingFundId || !editingFundName.trim()) return;
    await supabase.from('expense_fund_sources' as any).update({ name: editingFundName.trim(), updated_at: new Date().toISOString() } as any).eq('id', editingFundId);
    setEditingFundId(null); setEditingFundName('');
    toast({ title: 'Fund source updated' });
    fetchAll();
  };

  // Expense CRUD
  const resetExpenseForm = () => {
    setExpDesc(''); setExpCatId(''); setExpFundId(''); setExpAmount('');
    setExpDate(format(new Date(), 'yyyy-MM-dd')); setEditingExpense(null);
  };

  const saveExpense = async () => {
    if (!expDesc.trim() || !expAmount) {
      toast({ title: 'Please fill description and amount', variant: 'destructive' });
      return;
    }
    const payload: any = {
      description: expDesc.trim(),
      category_id: expCatId || null,
      fund_source_id: expFundId || null,
      amount: parseInt(expAmount),
      date: expDate,
      updated_at: new Date().toISOString(),
    };

    if (editingExpense) {
      const { error } = await supabase.from('expenses' as any).update(payload).eq('id', editingExpense);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Expense updated' });
    } else {
      const { error } = await supabase.from('expenses' as any).insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Expense added' });
    }
    resetExpenseForm();
    fetchAll();
  };

  const editExpense = (exp: Expense) => {
    setEditingExpense(exp.id);
    setExpDesc(exp.description);
    setExpCatId(exp.category_id || '');
    setExpFundId(exp.fund_source_id || '');
    setExpAmount(String(exp.amount));
    setExpDate(exp.date);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses' as any).delete().eq('id', id);
    toast({ title: 'Expense deleted' });
    fetchAll();
  };

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);
  const fundMap = useMemo(() => Object.fromEntries(fundSources.map(f => [f.id, f.name])), [fundSources]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Expense Management</h1>

      <Tabs defaultValue="setup">
        <TabsList>
          <TabsTrigger value="setup">Categories & Fund Sources</TabsTrigger>
          <TabsTrigger value="expenses">Expense Data</TabsTrigger>
        </TabsList>

        {/* Tab 1: Setup */}
        <TabsContent value="setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categories */}
            <Card>
              <CardHeader><CardTitle>Expense Categories</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
                  <Button onClick={addCategory} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      {editingCatId === cat.id ? (
                        <div className="flex gap-2 flex-1 mr-2">
                          <Input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditCat()} className="h-8 text-sm" />
                          <Button size="sm" variant="outline" onClick={saveEditCat}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCatId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{cat.name}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEditCat(cat)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet</p>}
                </div>
              </CardContent>
            </Card>

            {/* Fund Sources */}
            <Card>
              <CardHeader><CardTitle>Fund Sources</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Fund source name" value={newFundName} onChange={e => setNewFundName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFundSource()} />
                  <Button onClick={addFundSource} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>
                <div className="space-y-1">
                  {fundSources.map(fund => (
                    <div key={fund.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span className="text-sm">{fund.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteFundSource(fund.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                  {fundSources.length === 0 && <p className="text-sm text-muted-foreground">No fund sources yet</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Expense Data */}
        <TabsContent value="expenses">
          <Card className="mb-6">
            <CardHeader><CardTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium block mb-1">Description</label>
                  <Textarea placeholder="Details of expense..." value={expDesc} onChange={e => setExpDesc(e.target.value)} rows={2} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Date</label>
                  <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Category</label>
                  <Select value={expCatId} onValueChange={setExpCatId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Amount (Rp)</label>
                  <Input type="number" placeholder="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Fund Source</label>
                  <Select value={expFundId} onValueChange={setExpFundId}>
                    <SelectTrigger><SelectValue placeholder="Select fund source" /></SelectTrigger>
                    <SelectContent>
                      {fundSources.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={saveExpense}>{editingExpense ? 'Update' : 'Add'} Expense</Button>
                {editingExpense && <Button variant="outline" onClick={resetExpenseForm}>Cancel</Button>}
              </div>
            </CardContent>
          </Card>

          {/* Expense List */}
          <Card>
            <CardHeader><CardTitle>Expense Records</CardTitle></CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No expenses recorded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Fund Source</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(exp.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{exp.description}</TableCell>
                        <TableCell>{exp.category_id ? catMap[exp.category_id] || '-' : '-'}</TableCell>
                        <TableCell>{exp.fund_source_id ? fundMap[exp.fund_source_id] || '-' : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editExpense(exp)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminExpense;
