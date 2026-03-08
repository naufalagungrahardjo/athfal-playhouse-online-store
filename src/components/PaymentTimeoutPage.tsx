
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
      ? `Halo Athfal Playhouse, saya ingin mengonfirmasi pembayaran untuk Order ID: ${orderId?.slice(0, 8)} sebesar ${formatCurrency(totalAmount)}. Batas waktu pembayaran telah habis. Mohon segera dibantu untuk memastikan ketersediaan stok dan kelanjutan pesanan saya. Terima kasih.`
      : `Hello Athfal Playhouse, I would like to confirm my payment for Order ID: ${orderId?.slice(0, 8)} amounting to ${formatCurrency(totalAmount)}. The payment deadline has passed. Please assist me promptly to verify stock availability and proceed with my order. Thank you.`;
      
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
              {language === 'id' ? 'Batas waktu pembayaran 20 menit telah berakhir.' : 'The 20-minute payment deadline has passed.'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">
              {language === 'id' ? 'Perhatian' : 'Important Notice'}
            </h3>
            <p className="text-sm text-yellow-700 leading-relaxed">
              {language === 'id' 
                ? 'Jika Anda telah melakukan pembayaran, segera hubungi admin melalui WhatsApp untuk konfirmasi. Harap diperhatikan bahwa ketersediaan stok tidak dapat kami jamin setelah batas waktu berakhir. Semakin cepat Anda menghubungi kami, semakin besar kemungkinan pesanan Anda dapat diproses.'
                : 'If you have completed the payment, please contact our admin via WhatsApp immediately for confirmation. Please note that stock availability cannot be guaranteed once the payment deadline has passed. The sooner you reach out, the more likely we can fulfill your order.'}
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
                ? 'Tim kami akan merespons secepat mungkin.'
                : 'Our team will respond as soon as possible.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
