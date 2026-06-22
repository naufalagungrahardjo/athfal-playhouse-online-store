import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, ChevronDown, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableFooter } from "@/components/ui/table";

interface Props {
  orders: any[];
  onViewDetails: (order: any) => void;
}

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

const csvEscape = (v: any) => {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const isManualOrder = (o: any) =>
  typeof o.notes === "string" && o.notes.startsWith("[Manual Order]");

type SortKey =
  | "order_date"
  | "product"
  | "customer"
  | "contact"
  | "child_info"
  | "variant"
  | "qty"
  | "payment"
  | "status"
  | "total";

type SortDir = "asc" | "desc";

const defaultSortDir = (key: SortKey): SortDir => {
  if (key === "order_date" || key === "qty" || key === "total") return "desc";
  return "asc";
};

const COL_KEYS: SortKey[] = [
  "order_date",
  "product",
  "customer",
  "contact",
  "child_info",
  "variant",
  "qty",
  "payment",
  "status",
  "total",
];

const getColumnText = (row: { order: any; matchedItems: any[] }, key: SortKey): string => {
  const o = row.order;
  const items = row.matchedItems;
  switch (key) {
    case "order_date":
      return new Date(o.created_at).toLocaleString().toLowerCase();
    case "product":
      return Array.from(new Set(items.map((it: any) => it.product_name))).join(" ").toLowerCase();
    case "customer":
      return [o.customer_name, o.guardian_status, o.customer_address].filter(Boolean).join(" ").toLowerCase();
    case "contact":
      return [o.customer_email, o.customer_phone].filter(Boolean).join(" ").toLowerCase();
    case "child_info":
      return [o.child_name, o.child_gender, o.child_age].filter(Boolean).join(" ").toLowerCase();
    case "variant":
      return items
        .map((it: any) => [it.session_name, it.installment_plan_name].filter(Boolean).join(" "))
        .join(" ")
        .toLowerCase();
    case "qty":
      return String(items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0));
    case "payment":
      return String(o.payment_method || "").toLowerCase();
    case "status":
      return String(o.status || "").toLowerCase();
    case "total":
      return [o.total_amount, o.amount_paid].filter((v) => v != null).join(" ");
    default:
      return "";
  }
};

const getSortValue = (row: { order: any; matchedItems: any[] }, key: SortKey): string | number => {
  const o = row.order;
  const items = row.matchedItems;
  switch (key) {
    case "order_date":
      return new Date(o.created_at).getTime();
    case "product":
      return Array.from(new Set(items.map((it: any) => it.product_name))).join(" ").toLowerCase();
    case "customer":
      return String(o.customer_name || "").toLowerCase();
    case "contact":
      return [o.customer_email, o.customer_phone].filter(Boolean).join(" ").toLowerCase();
    case "child_info":
      return [o.child_name, o.child_gender, o.child_age].filter(Boolean).join(" ").toLowerCase();
    case "variant":
      return items
        .map((it: any) => [it.session_name, it.installment_plan_name].filter(Boolean).join(" "))
        .join(" ")
        .toLowerCase();
    case "qty":
      return items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);
    case "payment":
      return String(o.payment_method || "").toLowerCase();
    case "status":
      return String(o.status || "").toLowerCase();
    case "total":
      return Number(o.total_amount) || 0;
    default:
      return 0;
  }
};

export const OrderListByProductTab = ({ orders, onViewDetails }: Props) => {
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [includeOtherIncome, setIncludeOtherIncome] = useState(false);
  const [otherIncomes, setOtherIncomes] = useState<any[]>([]);
  const [fundSources, setFundSources] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [confirmedOverrides, setConfirmedOverrides] = useState<Record<string, boolean>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("order_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [colFilters, setColFilters] = useState<Record<SortKey, string>>({
    order_date: "",
    product: "",
    customer: "",
    contact: "",
    child_info: "",
    variant: "",
    qty: "",
    payment: "",
    status: "",
    total: "",
  });

  // Load Other Income + fund sources so they can be combined into this list.
  useEffect(() => {
    const load = async () => {
      const [incRes, fundRes] = await Promise.all([
        supabase.from("other_income" as any).select("*").order("date", { ascending: false }),
        supabase.from("expense_fund_sources" as any).select("id, name"),
      ]);
      setOtherIncomes((incRes.data as any) || []);
      setFundSources((fundRes.data as any) || []);
    };
    load();
  }, []);

  const fundMap = useMemo(
    () => Object.fromEntries((fundSources || []).map((f: any) => [f.id, f.name])),
    [fundSources]
  );

  // Pseudo-rows representing Other Income entries (fund source shown as payment).
  const incomeRows = useMemo(() => {
    if (!includeOtherIncome) return [];
    return (otherIncomes || []).map((inc: any) => {
      const fundName = inc.fund_source_id ? fundMap[inc.fund_source_id] || "Unknown" : "Unknown";
      const pseudo = {
        id: `income-${inc.id}`,
        __isIncome: true,
        created_at: inc.date,
        customer_name: inc.description,
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        guardian_status: "",
        child_name: "",
        child_gender: "",
        child_age: "",
        payment_method: fundName,
        status: "income",
        notes: "",
        promo_code: "",
        total_amount: Number(inc.amount) || 0,
        amount_paid: Number(inc.amount) || 0,
        subtotal: Number(inc.amount) || 0,
        tax_amount: 0,
        discount_amount: 0,
      };
      const matchedItems = [
        { product_name: "Other Income", quantity: 0, product_price: 0, session_name: "", installment_plan_name: "" },
      ];
      return { order: pseudo, matchedItems };
    });
  }, [includeOtherIncome, otherIncomes, fundMap]);

  // Build distinct product list from order items
  const productOptions = useMemo(() => {
    const set = new Map<string, { name: string; count: number }>();
    for (const o of orders || []) {
      for (const it of o.items || []) {
        const name = it.product_name || "";
        if (!name) continue;
        const cur = set.get(name) || { name, count: 0 };
        cur.count += 1;
        set.set(name, cur);
      }
    }
    return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const filteredProductOptions = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return productOptions;
    return productOptions.filter((p) => p.name.toLowerCase().includes(q));
  }, [productOptions, pickerSearch]);

  const toggleProduct = (name: string) => {
    setSelectedProductNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultSortDir(key));
    }
  };

  const isConfirmed = (o: any) =>
    confirmedOverrides[o.id] ?? !!o.payment_confirmed;

  const togglePaymentConfirmed = async (o: any, value: boolean) => {
    setConfirmedOverrides((prev) => ({ ...prev, [o.id]: value }));
    const { error } = await supabase
      .from("orders")
      .update({ payment_confirmed: value })
      .eq("id", o.id);
    if (error) {
      setConfirmedOverrides((prev) => ({ ...prev, [o.id]: !value }));
      toast.error("Failed to update payment confirmation");
    }
  };

  const getNote = (o: any) => noteOverrides[o.id] ?? (o.payment_note || "");

  const updatePaymentNote = async (o: any, value: string) => {
    setNoteOverrides((prev) => ({ ...prev, [o.id]: value }));
    const { error } = await supabase
      .from("orders")
      .update({ payment_note: value })
      .eq("id", o.id);
    if (error) {
      toast.error("Failed to save payment note");
    }
  };

  const updateColFilter = (key: SortKey, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearColFilters = () => {
    setColFilters({
      order_date: "",
      product: "",
      customer: "",
      contact: "",
      child_info: "",
      variant: "",
      qty: "",
      payment: "",
      status: "",
      total: "",
    });
  };

  // Orders containing any of the selected products
  const matchedRows = useMemo(() => {
    const rows: any[] = [];
    if (selectedProductNames.length > 0) {
      const selectedSet = new Set(selectedProductNames);
      for (const o of orders || []) {
        const matchedItems = (o.items || []).filter(
          (it: any) => selectedSet.has(it.product_name)
        );
        if (matchedItems.length === 0) continue;
        rows.push({ order: o, matchedItems });
      }
    }
    rows.push(...incomeRows);
    return rows;
  }, [orders, selectedProductNames, incomeRows]);

  // Apply global search + per-column filters
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = matchedRows;
    if (q) {
      rows = rows.filter(({ order: o, matchedItems }) => {
        const fields = [
          o.id,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.customer_address,
          o.guardian_status,
          o.child_name,
          o.child_age,
          o.child_gender,
          o.payment_method,
          o.status,
          o.notes,
          o.promo_code,
          ...matchedItems.map((it: any) => it.product_name || ""),
          ...matchedItems.map((it: any) => it.session_name || ""),
          ...matchedItems.map((it: any) => it.installment_plan_name || ""),
        ];
        return fields.some((v) => v != null && String(v).toLowerCase().includes(q));
      });
    }
    for (const key of COL_KEYS) {
      const term = colFilters[key].trim().toLowerCase();
      if (!term) continue;
      rows = rows.filter((row) => getColumnText(row, key).includes(term));
    }
    return rows;
  }, [matchedRows, search, colFilters]);

  const sortedRows = useMemo(() => {
    const aDir = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((aRow, bRow) => {
      const a = getSortValue(aRow, sortKey);
      const b = getSortValue(bRow, sortKey);
      if (typeof a === "number" && typeof b === "number") return (a - b) * aDir;
      return String(a).localeCompare(String(b)) * aDir;
    });
  }, [filteredRows, sortKey, sortDir]);

  const totals = useMemo(() => {
    let qty = 0;
    let revenue = 0;
    let totalAmount = 0;
    let cashReceived = 0;
    for (const r of sortedRows) {
      const o = r.order;
      totalAmount += Number(o.total_amount) || 0;
      // Cash actually collected (matches Analytics / bank): paid installments
      // only, capped at the net order value, excluding cancelled & refunded orders.
      if (o.status !== "cancelled" && o.status !== "refund") {
        const net = Math.max(
          0,
          (Number(o.subtotal) || 0) +
            (Number(o.tax_amount) || 0) -
            (Number(o.discount_amount) || 0)
        );
        cashReceived += Math.min(Math.max(0, Number(o.amount_paid) || 0), net);
      }
      for (const it of r.matchedItems) {
        qty += Number(it.quantity) || 0;
        revenue += (Number(it.product_price) || 0) * (Number(it.quantity) || 0);
      }
    }
    return { qty, revenue, totalAmount, cashReceived, customers: sortedRows.length };
  }, [sortedRows]);

  const exportCSV = () => {
    const headers = [
      "Order ID",
      "Order Date",
      "Product",
      "Customer Name",
      "Email",
      "Phone",
      "Address",
      "Guardian Status",
      "Child Name",
      "Child Gender",
      "Child Age",
      "Variant / Session",
      "Installment Plan",
      "Quantity",
      "Unit Price",
      "Line Total",
      "Payment Method",
      "Order Status",
      "Total Amount",
      "Amount Paid",
      "Promo Code",
      "Notes",
    ];
    const lines: string[] = [headers.join(",")];
    for (const { order: o, matchedItems } of sortedRows) {
      for (const it of matchedItems) {
        lines.push(
          [
            o.id,
            new Date(o.created_at).toLocaleString(),
            it.product_name,
            o.customer_name,
            o.customer_email,
            o.customer_phone,
            o.customer_address,
            o.guardian_status,
            o.child_name,
            o.child_gender,
            o.child_age,
            it.session_name,
            it.installment_plan_name,
            it.quantity,
            it.product_price,
            (Number(it.product_price) || 0) * (Number(it.quantity) || 0),
            o.payment_method,
            o.status,
            o.total_amount,
            o.amount_paid,
            o.promo_code,
            o.notes,
          ]
            .map(csvEscape)
            .join(",")
        );
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-list-${selectedProductNames
      .map((n) => n.replace(/[^\w]+/g, "_"))
      .join("-")
      .slice(0, 80) || "products"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHead = ({
    label,
    sKey,
    className,
  }: {
    label: string;
    sKey: SortKey;
    className?: string;
  }) => {
    const active = sortKey === sKey;
    return (
      <TableHead
        className={cn("cursor-pointer select-none whitespace-nowrap", className)}
        onClick={() => handleSort(sKey)}
      >
        <div className={cn("flex items-center gap-1", className?.includes("text-right") && "justify-end")}>
          <span>{label}</span>
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </div>
      </TableHead>
    );
  };

  const anyColFilter = Object.values(colFilters).some((v) => v.trim());
  const hasSelection = selectedProductNames.length > 0 || includeOtherIncome;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order List by Product</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[420px] justify-between font-normal"
              >
                <span className="truncate text-left">
                  {selectedProductNames.length === 0
                    ? includeOtherIncome
                      ? "Other Income selected"
                      : "Select products to combine..."
                    : `${selectedProductNames.length} product${selectedProductNames.length > 1 ? "s" : ""} selected${includeOtherIncome ? " + Other Income" : ""}`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              <div className="p-2 border-b space-y-2">
                <Input
                  placeholder="Search products..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="h-8"
                />
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() =>
                      setSelectedProductNames(filteredProductOptions.map((p) => p.name))
                    }
                  >
                    Select all{pickerSearch ? " (filtered)" : ""}
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:underline"
                    onClick={() => {
                      setSelectedProductNames([]);
                      setIncludeOtherIncome(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="px-2 py-2 border-b">
                <label className="flex items-start gap-2 px-2 py-2 rounded-sm hover:bg-accent cursor-pointer">
                  <Checkbox
                    checked={includeOtherIncome}
                    onCheckedChange={(v) => setIncludeOtherIncome(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm flex-1">
                    Other Income{" "}
                    <span className="text-muted-foreground">({otherIncomes.length})</span>
                  </span>
                </label>
              </div>
              <ScrollArea className="h-[320px]">
                {filteredProductOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">
                    No products found.
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredProductOptions.map((p) => {
                      const checked = selectedProductNames.includes(p.name);
                      return (
                        <label
                          key={p.name}
                          className="flex items-start gap-2 px-2 py-2 rounded-sm hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleProduct(p.name)}
                            className="mt-0.5"
                          />
                          <span className="text-sm flex-1">
                            {p.name}{" "}
                            <span className="text-muted-foreground">({p.count})</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customer, child, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              disabled={!hasSelection}
            />
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={sortedRows.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        {hasSelection && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {selectedProductNames.map((name) => (
                <Badge key={name} variant="outline" className="gap-1 pr-1">
                  <span className="max-w-[260px] truncate">{name}</span>
                  <button
                    type="button"
                    onClick={() => toggleProduct(name)}
                    className="rounded-sm hover:bg-muted p-0.5"
                    aria-label={`Remove ${name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Orders: {totals.customers}</Badge>
              <Badge variant="secondary">Total Qty: {totals.qty}</Badge>
              <Badge variant="secondary">Revenue: {fmtIDR(totals.revenue)}</Badge>
            </div>
          </>
        )}

        {!hasSelection ? (
          <div className="text-center py-12 text-muted-foreground">
            Tick one or more products (or Other Income) to see the list.
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders found for the selected products.
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead label="Order Date" sKey="order_date" />
                  <SortHead label="Product" sKey="product" />
                  <SortHead label="Customer" sKey="customer" />
                  <SortHead label="Contact" sKey="contact" />
                  <SortHead label="Child Info" sKey="child_info" />
                  <SortHead label="Variant / Session" sKey="variant" />
                  <SortHead label="Qty" sKey="qty" />
                  <SortHead label="Payment" sKey="payment" />
                  <SortHead label="Status" sKey="status" />
                  <SortHead label="Total" sKey="total" className="text-right" />
                  <TableHead className="w-10"></TableHead>
                </TableRow>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter date"
                      value={colFilters.order_date}
                      onChange={(e) => updateColFilter("order_date", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter product"
                      value={colFilters.product}
                      onChange={(e) => updateColFilter("product", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter customer"
                      value={colFilters.customer}
                      onChange={(e) => updateColFilter("customer", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter contact"
                      value={colFilters.contact}
                      onChange={(e) => updateColFilter("contact", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter child"
                      value={colFilters.child_info}
                      onChange={(e) => updateColFilter("child_info", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter variant"
                      value={colFilters.variant}
                      onChange={(e) => updateColFilter("variant", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter qty"
                      value={colFilters.qty}
                      onChange={(e) => updateColFilter("qty", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter payment"
                      value={colFilters.payment}
                      onChange={(e) => updateColFilter("payment", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2">
                    <Input
                      placeholder="Filter status"
                      value={colFilters.status}
                      onChange={(e) => updateColFilter("status", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2 text-right">
                    <Input
                      placeholder="Filter total"
                      value={colFilters.total}
                      onChange={(e) => updateColFilter("total", e.target.value)}
                      className="h-7 text-xs px-2"
                    />
                  </TableHead>
                  <TableHead className="py-1 px-2 w-10">
                    {anyColFilter && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={clearColFilters}
                        aria-label="Clear column filters"
                        title="Clear column filters"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map(({ order: o, matchedItems }) => (
                  <TableRow
                    key={o.id}
                    className={cn(
                      isManualOrder(o) && "bg-green-50 hover:bg-green-100"
                    )}
                  >
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                      <div className="text-muted-foreground">
                        {new Date(o.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">
                      {Array.from(new Set(matchedItems.map((it: any) => it.product_name))).map(
                        (n: any) => (
                          <div key={n} className="line-clamp-2">{n}</div>
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customer_name}</div>
                      {o.guardian_status && (
                        <div className="text-xs text-muted-foreground">{o.guardian_status}</div>
                      )}
                      {o.customer_address && (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]">
                          {o.customer_address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{o.customer_email}</div>
                      <div className="text-muted-foreground">{o.customer_phone}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.child_name ? (
                        <>
                          <div className="font-medium">{o.child_name}</div>
                          <div className="text-muted-foreground">
                            {[o.child_gender, o.child_age].filter(Boolean).join(" · ")}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {matchedItems.map((it: any, idx: number) => (
                        <div key={idx}>
                          {it.session_name || "—"}
                          {it.installment_plan_name && (
                            <span className="text-muted-foreground"> · {it.installment_plan_name}</span>
                          )}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {matchedItems.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0)}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{o.payment_method}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs">
                      <div>{fmtIDR(o.total_amount)}</div>
                      <div className="text-muted-foreground">
                        Paid: {fmtIDR(o.amount_paid || 0)}
                      </div>
                      <label className="mt-1 flex items-center justify-end gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={isConfirmed(o)}
                          onCheckedChange={(v) => togglePaymentConfirmed(o, v === true)}
                        />
                        <span className="text-[11px] text-muted-foreground">Payment confirmed</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Payment note..."
                        value={getNote(o)}
                        onChange={(e) => setNoteOverrides((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        onBlur={(e) => updatePaymentNote(o, e.target.value)}
                        className="mt-1 h-6 text-[11px] px-1.5 py-0 w-[140px] ml-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => onViewDetails(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="font-semibold">
                    Total ({totals.customers})
                  </TableCell>
                  <TableCell className="font-bold">{totals.qty}</TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    <div>{fmtIDR(totals.cashReceived)}</div>
                    <div className="text-[11px] font-normal text-muted-foreground">
                      Cash received
                    </div>
                    <div className="text-[11px] font-normal text-muted-foreground">
                      Billed: {fmtIDR(totals.totalAmount)}
                    </div>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderListByProductTab;
