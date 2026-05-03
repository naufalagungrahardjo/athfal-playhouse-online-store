import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateBillingNoticePdf } from "@/lib/billingNoticePdf";

interface Notice {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  description: string | null;
}

interface OrderInfo {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export const CustomerBillingNotices = ({ order }: { order: OrderInfo }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: assigns } = await supabase
        .from("billing_notice_assignments")
        .select("notice_id")
        .eq("order_id", order.id);
      const ids = (assigns || []).map((a: any) => a.notice_id);
      if (!ids.length) {
        if (!cancelled) { setNotices([]); setLoading(false); }
        return;
      }
      const { data: ns } = await supabase
        .from("billing_notices")
        .select("id,title,amount,due_date,description")
        .in("id", ids);
      if (!cancelled) {
        setNotices((ns as Notice[]) || []);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [order.id]);

  if (loading || notices.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-3">
      <p className="font-semibold text-sm mb-2">
        {language === "id" ? "Tagihan Mendatang" : "Upcoming Billing Notices"}
      </p>
      <ul className="space-y-2">
        {notices.map((n) => (
          <li key={n.id} className="border rounded p-3 bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm">
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center mt-1">
                <Badge variant="secondary">{language === "id" ? "Jatuh tempo" : "Due"} {new Date(n.due_date).toLocaleDateString()}</Badge>
                <span className="font-semibold text-foreground">{formatCurrency(n.amount)}</span>
              </div>
              {n.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.description}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => generateBillingNoticePdf({ notice: n, order })}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};