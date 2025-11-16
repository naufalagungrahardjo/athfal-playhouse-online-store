import { ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useMemo } from "react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const getStatusLabel = (status: string, language: string) => {
  const statusMap: Record<string, { id: string; en: string }> = {
    pending: { id: 'Menunggu Pembayaran', en: 'Pending Payment' },
    processing: { id: 'Diproses', en: 'Processing' },
    shipped: { id: 'Dikirim', en: 'Shipped' },
    completed: { id: 'Selesai', en: 'Completed' },
    cancelled: { id: 'Dibatalkan', en: 'Cancelled' },
  };
  return language === 'id' ? statusMap[status]?.id || status : statusMap[status]?.en || status;
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const OrderHistoryPanel = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { orders, loading } = useOrders();

  // Filter orders for the current logged-in user
  const userOrders = useMemo(() => {
    if (!user?.id) return [];
    return orders
      .filter(order => order.user_id === user.id)
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }, [orders, user?.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {language === 'id' ? 'Memuat pesanan...' : 'Loading orders...'}
        </p>
      </div>
    );
  }

  if (!userOrders || userOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">
          {language === 'id' ? 'Tidak ada pesanan' : 'No orders yet'}
        </h3>
        <p className="text-muted-foreground mt-1">
          {language === 'id' 
            ? 'Pesanan Anda akan muncul di sini' 
            : 'Your orders will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userOrders.map((order) => (
        <div key={order.id} className="border rounded-xl p-4 bg-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <div>
              <p className="font-semibold">
                {language === 'id' ? 'Nomor Pesanan' : 'Order Number'}: {order.id.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'id' ? 'Tanggal' : 'Date'}: {formatDate(order.created_at || '')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'id' ? 'Nama' : 'Name'}: {order.customer_name}
              </p>
              {order.customer_address && (
                <p className="text-sm text-muted-foreground">
                  {language === 'id' ? 'Alamat' : 'Address'}: {order.customer_address}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status, language)}
            </Badge>
          </div>
          <div className="border-t pt-4">
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="text-foreground">
                        {item.product_name} x{item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground">
                        {formatCurrency(item.product_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  {language === 'id' ? 'Tidak ada item' : 'No items'}
                </p>
              )}
            </div>
            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'id' ? 'Subtotal' : 'Subtotal'}</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'id' ? 'Pajak' : 'Tax'}</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{language === 'id' ? 'Diskon' : 'Discount'}</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-base">
                <span>{language === 'id' ? 'Total' : 'Total'}</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistoryPanel;
