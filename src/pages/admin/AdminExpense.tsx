import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Trash2, Plus, Pencil, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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
  discount: number;
  date: string;
  created_at: string;
  order_id: string | null;
  is_checked: boolean | null;
  check_notes: string | null;
};

type SortKey = 'created_at' | 'date' | 'description' | 'order_id' | 'category' | 'fund_source' | 'amount' | 'discount' | 'final_price';
type ColFilters = {
  created_at: string;
  date: string;
  description: string;
  order_id: string;
  category: string;
  fund_source: string;
  amount: string;
  discount: string;
  final_price: string;
};

const SortHead = ({
  label,
  sortKeyName,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKeyName: SortKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}) => {
  const isRight = className?.includes('text-right');
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKeyName)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors w-full ${isRight ? 'justify-end' : ''}`}
      >
        {label}
        {sortKey === sortKeyName ? (
          sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
};

const FilterCell = ({
  filterKey,
  value,
  onChange,
  className,
}: {
  filterKey: keyof ColFilters;
  value: string;
  onChange: (key: keyof ColFilters, value: string) => void;
  className?: string;
}) => (
  <TableHead className={`pt-0 pb-2 ${className || ''}`}>
    <Input
      value={value}
      onChange={e => onChange(filterKey, e.target.value)}
      placeholder="Filter..."
      className="h-7 text-xs font-normal"
    />
  </TableHead>
);

const AdminExpense = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('setup');

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
  const [expDiscount, setExpDiscount] = useState('');
  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const expenseFormRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [catsRes, fundsRes, expRes] = await Promise.all([
      supabase.from('expense_categories' as any).select('id, name').order('name'),
      supabase.from('expense_fund_sources' as any).select('id, name').order('name'),
      supabase.from('expenses' as any).select('*').order('created_at', { ascending: false }),
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
    setExpDesc(''); setExpCatId(''); setExpFundId(''); setExpAmount(''); setExpDiscount('');
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
      discount: parseInt(expDiscount) || 0,
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
    setExpDiscount(String(exp.discount || 0));
    setExpDate(exp.date);
    setTimeout(() => {
      expenseFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses' as any).delete().eq('id', id);
    toast({ title: 'Expense deleted' });
    fetchAll();
  };

  const updateCheck = async (id: string, patch: { is_checked?: boolean; check_notes?: string }) => {
    const { error } = await supabase.from('expenses' as any).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...patch } : exp));
  };

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);
  const fundMap = useMemo(() => Object.fromEntries(fundSources.map(f => [f.id, f.name])), [fundSources]);

  const [expSearch, setExpSearch] = useState('');

  const emptyColFilters: ColFilters = {
    created_at: '', date: '', description: '', order_id: '',
    category: '', fund_source: '', amount: '', discount: '', final_price: '',
  };
  const [colFilters, setColFilters] = useState<ColFilters>(emptyColFilters);
  const setColFilter = (key: keyof ColFilters, value: string) =>
    setColFilters(prev => ({ ...prev, [key]: value }));
  const hasColFilters = Object.values(colFilters).some(v => v.trim() !== '');

  const filteredExpenses = useMemo(() => {
    const q = expSearch.trim().toLowerCase();
    if (!q && !hasColFilters) return expenses;
    return expenses.filter(exp => {
      const desc = exp.description?.toLowerCase() || '';
      const cat = (exp.category_id ? catMap[exp.category_id] || '' : '').toLowerCase();
      const fund = (exp.fund_source_id ? fundMap[exp.fund_source_id] || '' : '').toLowerCase();
      const amount = String(exp.amount);
      const discount = String(exp.discount || 0);
      const finalPrice = String(exp.amount - (exp.discount || 0));
      const createdStr = format(new Date(exp.created_at), 'EEE, d MMM yyyy').toLowerCase();
      const dateStr = format(new Date(exp.date), 'EEE, d MMM yyyy').toLowerCase();
      const orderId = (exp.order_id || '').toLowerCase();

      // Global search
      if (q) {
        const globalMatch =
          desc.includes(q) || cat.includes(q) || fund.includes(q) ||
          amount.includes(q) || finalPrice.includes(q) || dateStr.includes(q);
        if (!globalMatch) return false;
      }

      // Per-column filters (all must match)
      const f = colFilters;
      if (f.created_at.trim() && !createdStr.includes(f.created_at.toLowerCase())) return false;
      if (f.date.trim() && !dateStr.includes(f.date.toLowerCase())) return false;
      if (f.description.trim() && !desc.includes(f.description.toLowerCase())) return false;
      if (f.order_id.trim() && !orderId.includes(f.order_id.toLowerCase())) return false;
      if (f.category.trim() && !cat.includes(f.category.toLowerCase())) return false;
      if (f.fund_source.trim() && !fund.includes(f.fund_source.toLowerCase())) return false;
      if (f.amount.trim() && !amount.includes(f.amount.replace(/\D/g, ''))) return false;
      if (f.discount.trim() && !discount.includes(f.discount.replace(/\D/g, ''))) return false;
      if (f.final_price.trim() && !finalPrice.includes(f.final_price.replace(/\D/g, ''))) return false;
      return true;
    });
  }, [expenses, expSearch, catMap, fundMap, colFilters, hasColFilters]);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedExpenses = useMemo(() => {
    const getValue = (exp: Expense): string | number => {
      switch (sortKey) {
        case 'created_at': return new Date(exp.created_at).getTime();
        case 'date': return new Date(exp.date).getTime();
        case 'description': return (exp.description || '').toLowerCase();
        case 'order_id': return (exp.order_id || '').toLowerCase();
        case 'category': return (exp.category_id ? catMap[exp.category_id] || '' : '').toLowerCase();
        case 'fund_source': return (exp.fund_source_id ? fundMap[exp.fund_source_id] || '' : '').toLowerCase();
        case 'amount': return exp.amount;
        case 'discount': return exp.discount || 0;
        case 'final_price': return exp.amount - (exp.discount || 0);
        default: return 0;
      }
    };
    const sorted = [...filteredExpenses].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredExpenses, sortKey, sortDir, catMap, fundMap]);

  const expenseTotals = useMemo(() => {
    return sortedExpenses.reduce(
      (acc, exp) => {
        acc.amount += exp.amount || 0;
        acc.discount += exp.discount || 0;
        acc.final += (exp.amount || 0) - (exp.discount || 0);
        return acc;
      },
      { amount: 0, discount: 0, final: 0 }
    );
  }, [sortedExpenses]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Expense Management</h1>

      <Tabs defaultValue="setup" value={activeTab} onValueChange={setActiveTab}>
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
                      {editingFundId === fund.id ? (
                        <div className="flex gap-2 flex-1 mr-2">
                          <Input value={editingFundName} onChange={e => setEditingFundName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditFund()} className="h-8 text-sm" />
                          <Button size="sm" variant="outline" onClick={saveEditFund}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingFundId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{fund.name}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEditFund(fund)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteFundSource(fund.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </>
                      )}
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
          <Card className="mb-6" ref={expenseFormRef}>
            <CardHeader><CardTitle>{editingExpense ? '✏️ Edit Expense' : 'Add New Expense'}</CardTitle></CardHeader>
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
                  <label className="text-sm font-medium block mb-1">Discount (Rp)</label>
                  <Input type="number" placeholder="0" value={expDiscount} onChange={e => setExpDiscount(e.target.value)} />
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
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Expense Records</CardTitle>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, amount, category, date..."
                    className="pl-8"
                    value={expSearch}
                    onChange={e => setExpSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match your search'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHead label="Created Date" sortKeyName="created_at" />
                      <SortHead label="Transaction Date" sortKeyName="date" />
                      <SortHead label="Description" sortKeyName="description" />
                      <SortHead label="Order ID" sortKeyName="order_id" />
                      <SortHead label="Category" sortKeyName="category" />
                      <SortHead label="Fund Source" sortKeyName="fund_source" />
                      <SortHead label="Amount" sortKeyName="amount" className="text-right" />
                      <SortHead label="Discount" sortKeyName="discount" className="text-right" />
                      <SortHead label="Final Price" sortKeyName="final_price" className="text-right" />
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <FilterCell filterKey="created_at" />
                      <FilterCell filterKey="date" />
                      <FilterCell filterKey="description" />
                      <FilterCell filterKey="order_id" />
                      <FilterCell filterKey="category" />
                      <FilterCell filterKey="fund_source" />
                      <FilterCell filterKey="amount" />
                      <FilterCell filterKey="discount" />
                      <FilterCell filterKey="final_price" />
                      <TableHead className="pt-0 pb-2">
                        {hasColFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setColFilters(emptyColFilters)}
                          >
                            Clear
                          </Button>
                        )}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedExpenses.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(exp.created_at), 'EEE, d MMM yyyy')}</TableCell>
                        <TableCell className="whitespace-nowrap">{format(new Date(exp.date), 'EEE, d MMM yyyy')}</TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
                            {exp.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono max-w-[120px] truncate">{exp.order_id ? exp.order_id.slice(0, 8) + '...' : '-'}</TableCell>
                        <TableCell>{exp.category_id ? catMap[exp.category_id] || '-' : '-'}</TableCell>
                        <TableCell>{exp.fund_source_id ? fundMap[exp.fund_source_id] || '-' : '-'}</TableCell>
                        <TableCell className="text-right align-top">
                          <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
                            <span className="font-medium">{formatCurrency(exp.amount)}</span>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox
                                checked={!!exp.is_checked}
                                onCheckedChange={(val) => updateCheck(exp.id, { is_checked: val === true })}
                                aria-label="Mark expense as checked"
                              />
                              Checked
                            </label>
                            <Input
                              type="text"
                              placeholder="Note..."
                              defaultValue={exp.check_notes || ''}
                              onBlur={(e) => updateCheck(exp.id, { check_notes: e.target.value })}
                              className="h-7 text-xs text-right w-full min-w-[120px]"
                              aria-label="Check note"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(exp.discount || 0)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(exp.amount - (exp.discount || 0))}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => editExpense(exp)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="font-semibold">Total ({sortedExpenses.length})</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(expenseTotals.amount)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(expenseTotals.discount)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(expenseTotals.final)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
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
