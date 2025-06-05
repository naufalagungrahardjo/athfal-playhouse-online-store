
import { Clock, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface PaymentTimeoutPageProps {
  orderId?: string;
  totalAmount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const PaymentTimeoutPage = ({ orderId, totalAmount }: PaymentTimeoutPageProps) => {
  const { language } = useLanguage();

  const handleContactAdmin = () => {
    const message = language === 'id'
      ? `Halo Athfal Playhouse, saya membutuhkan bantuan terkait pembayaran untuk Order ID: ${orderId?.slice(0, 8)}. Batas waktu pembayaran telah habis, namun saya sudah/belum melakukan pembayaran sebesar ${formatCurrency(totalAmount)}. Mohon bantuannya untuk melanjutkan proses pesanan saya. Terima kasih.`
      : `Hello Athfal Playhouse, I need assistance regarding payment for Order ID: ${orderId?.slice(0, 8)}. The payment time limit has expired, but I have/have not made the payment of ${formatCurrency(totalAmount)}. Please help me continue my order process. Thank you.`;
      
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '082120614748';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/^0/, '62')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Waktu Pembayaran Habis' : 'Payment Time Expired'}
            </h1>
            <p className="text-gray-600">
              {language === 'id' ? 'Batas waktu pembayaran 25 menit telah berakhir' : 'The 25-minute payment time limit has ended'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">
              {language === 'id' ? 'Jangan Khawatir!' : "Don't Worry!"}
            </h3>
            <p className="text-sm text-yellow-700 leading-relaxed">
              {language === 'id' 
                ? 'Jika Anda sudah melakukan pembayaran, pesanan Anda tetap akan diproses. Silakan hubungi admin kami untuk konfirmasi. Jika belum, Anda masih bisa melakukan pembayaran dan menghubungi admin untuk melanjutkan proses.'
                : 'If you have already made the payment, your order will still be processed. Please contact our admin for confirmation. If not, you can still make the payment and contact admin to continue the process.'}
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleContactAdmin}
              className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white py-6 text-lg rounded-xl"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              {language === 'id' ? 'Hubungi Admin via WhatsApp' : 'Contact Admin via WhatsApp'}
            </Button>

            <Link to="/" className="block">
              <Button variant="outline" className="w-full py-6 text-lg rounded-xl">
                <Home className="mr-2 h-5 w-5" />
                {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {language === 'id' 
                ? 'Admin kami siap membantu Anda 24/7'
                : 'Our admin is ready to help you 24/7'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
