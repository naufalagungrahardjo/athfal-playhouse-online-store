import { ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

// Copy of mockOrderHistory and helpers from ProfilePage
const mockOrderHistory = [
  {
    id: 'ORD-001',
    date: '2023-05-10',
    items: [
      { name: 'Pop Up Class - Usia 2-3 Tahun', price: 250000, quantity: 1 }
    ],
    total: 250000,
    status: 'completed'
  },
  {
    id: 'ORD-002',
    date: '2023-04-25',
    items: [
      { name: 'Play Kit - Alphabet Fun', price: 199000, quantity: 1 },
      { name: 'Kaos Athfal Playhouse - Anak', price: 120000, quantity: 2 }
    ],
    total: 439000,
    status: 'completed'
  }
];

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

const OrderHistoryPanel = () => {
  const { language } = useLanguage();
  const orderHistory = mockOrderHistory; // Replace with state or props in real app

  if (!orderHistory || orderHistory.length === 0) {
    return (
      <div className="text-center py-6">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700">
          {language === 'id' ? 'Tidak ada pesanan' : 'No orders yet'}
        </h3>
        <p className="text-gray-500 mt-1">
          {language === 'id' 
            ? 'Pesanan Anda akan muncul di sini' 
            : 'Your orders will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderHistory.map((order) => (
        <div key={order.id} className="border rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <p className="font-semibold">
                {language === 'id' ? 'Nomor Pesanan' : 'Order Number'}: {order.id}
              </p>
              <p className="text-sm text-gray-500">
                {language === 'id' ? 'Tanggal' : 'Date'}: {formatDate(order.date)}
              </p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status === 'completed' 
                  ? (language === 'id' ? 'Selesai' : 'Completed') 
                  : (language === 'id' ? 'Menunggu Pembayaran' : 'Pending')}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="text-gray-800">
                      {item.name} x{item.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>{language === 'id' ? 'Total' : 'Total'}</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistoryPanel;
