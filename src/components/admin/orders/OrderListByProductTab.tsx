import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export const OrderListByProductTab = ({ orders, onViewDetails }: Props) => {
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");

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

  // Orders containing any of the selected products
  const matchedRows = useMemo(() => {
    if (selectedProductNames.length === 0) return [];
    const selectedSet = new Set(selectedProductNames);
    const rows: any[] = [];
    for (const o of orders || []) {
      const matchedItems = (o.items || []).filter(
        (it: any) => selectedSet.has(it.product_name)
      );
      if (matchedItems.length === 0) continue;
      rows.push({ order: o, matchedItems });
    }
    // Filter by search across customer and child fields
    const q = search.trim().toLowerCase();
    const filtered = !q
      ? rows
      : rows.filter(({ order: o, matchedItems }) => {
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
            ...matchedItems.map((it: any) => it.session_name || ""),
            ...matchedItems.map((it: any) => it.installment_plan_name || ""),
          ];
          return fields.some((v) => v != null && String(v).toLowerCase().includes(q));
        });
    // Sort newest first
    return filtered.sort(
      (a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
    );
  }, [orders, selectedProductNames, search]);

  const totals = useMemo(() => {
    let qty = 0;
    let revenue = 0;
    for (const r of matchedRows) {
      for (const it of r.matchedItems) {
        qty += Number(it.quantity) || 0;
        revenue += (Number(it.product_price) || 0) * (Number(it.quantity) || 0);
      }
    }
    return { qty, revenue, customers: matchedRows.length };
  }, [matchedRows]);

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
    for (const { order: o, matchedItems } of matchedRows) {
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
                    ? "Select products to combine..."
                    : `${selectedProductNames.length} product${selectedProductNames.length > 1 ? "s" : ""} selected`}
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
                    onClick={() => setSelectedProductNames([])}
                  >
                    Clear
                  </button>
                </div>
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
              disabled={selectedProductNames.length === 0}
            />
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={matchedRows.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        {selectedProductNames.length > 0 && (
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

        {selectedProductNames.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Tick one or more products to see all customers who ordered them.
          </div>
        ) : matchedRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No orders found for the selected products.
          </div>
        ) : (
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Child Info</TableHead>
                  <TableHead>Variant / Session</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchedRows.map(({ order: o, matchedItems }) => (
                  <TableRow key={o.id}>
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
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => onViewDetails(o)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderListByProductTab;