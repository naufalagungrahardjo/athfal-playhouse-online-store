
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useDatabase } from '@/hooks/useDatabase';
import { ArrowLeft, Copy, Check, Clock } from 'lucide-react';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const OrderDetailsPage = () => {
  const { language } = useLanguage();
  const { items, getSubtotal, getTaxAmount, getTotal, clearCart } = useCart();
  const { paymentMethods } = useDatabase();
  const { orderId } = useParams();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);

  // Get the payment method from localStorage or from stored order data
  useEffect(() => {
    const savedPaymentMethodId = localStorage.getItem('selectedPaymentMethodId');
    if (savedPaymentMethodId && paymentMethods.length > 0) {
      const paymentMethod = paymentMethods.find(method => method.id === savedPaymentMethodId);
      if (paymentMethod) {
        setSelectedPaymentMethod(paymentMethod);
      }
    }
  }, [paymentMethods]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle copy account number
  const handleCopyAccountNumber = () => {
    if (selectedPaymentMethod) {
      navigator.clipboard.writeText(selectedPaymentMethod.account_number);
      setCopiedAccountNumber(true);
      
      // Reset copy icon after 2 seconds
      setTimeout(() => {
        setCopiedAccountNumber(false);
      }, 2000);
    }
  };

  // Handle confirm payment
  const handleConfirmPayment = () => {
    // Format items for WhatsApp message
    const itemsList = items.map(item => 
      `${item.product.name} (${item.quantity}x) - ${formatCurrency(item.product.price * item.quantity)}`
    ).join('\n');

    // Construct WhatsApp message
    const message = `
*${language === 'id' ? 'KONFIRMASI PEMBAYARAN ATHFAL PLAYHOUSE' : 'ATHFAL PLAYHOUSE PAYMENT CONFIRMATION'}*

${orderId ? `*Order ID: ${orderId.slice(0, 8)}*` : ''}

*${language === 'id' ? 'Detail Pesanan' : 'Order Details'}:*
${itemsList}

*${language === 'id' ? 'Total' : 'Total'}: ${formatCurrency(getTotal())}*

${language === 'id' ? 'Saya telah melakukan pembayaran dan ingin mengonfirmasi pesanan saya.' : 'I have made the payment and would like to confirm my order.'}
    `;

    // Encode the message for WhatsApp
    const encodedMessage = encodeURIComponent(message.trim());
    const whatsappNumber = '082120614748';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/^0/, '62')}?text=${encodedMessage}`;
    
    // Redirect to WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Clear cart and stored payment method after sending confirmation
    clearCart();
    localStorage.removeItem('selectedPaymentMethodId');
    localStorage.removeItem('appliedPromo');
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-2">
          {language === 'id' ? 'Detail Pesanan' : 'Order Details'}
        </h1>
        
        {/* Countdown timer */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8 flex items-center">
          <Clock className="text-yellow-600 mr-3" />
          <div>
            <p className="font-medium text-yellow-800">
              {language === 'id' ? 'Batas Waktu Pembayaran:' : 'Payment Time Limit:'}
            </p>
            <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-yellow-600'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order details */}
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-3xl shadow-md overflow-hidden mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-athfal-pink mb-4">
                  {language === 'id' ? 'Detail Produk' : 'Product Details'}
                </h2>

                {/* Products list */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600">
                            {language === 'id' ? 'Jumlah' : 'Quantity'}: {item.quantity}
                          </p>
                          <p className="font-medium text-athfal-green">
                            {formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Subtotal' : 'Subtotal'}</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Pajak' : 'Tax'}</span>
                    <span>{formatCurrency(getTaxAmount())}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>{language === 'id' ? 'Total' : 'Total'}</span>
                    <span className="text-athfal-green">{formatCurrency(getTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card className="bg-white rounded-3xl shadow-md overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-athfal-pink mb-4">
                  {language === 'id' ? 'Instruksi Pembayaran' : 'Payment Instructions'}
                </h2>
                
                {selectedPaymentMethod ? (
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{selectedPaymentMethod.bank_name}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCopyAccountNumber}
                        >
                          {copiedAccountNumber ? (
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {language === 'id' ? 'Salin No. Rekening' : 'Copy Account No.'}
                        </Button>
                      </div>
                      <p className="text-gray-700">
                        {language === 'id' ? 'Nomor Rekening:' : 'Account Number:'} <span className="font-medium">{selectedPaymentMethod.account_number}</span>
                      </p>
                      <p className="text-gray-700">
                        {language === 'id' ? 'Atas Nama:' : 'Account Name:'} <span className="font-medium">{selectedPaymentMethod.account_name}</span>
                      </p>
                    </div>
                    
                    <h3 className="font-semibold text-athfal-green mb-3">
                      {language === 'id' ? 'Langkah Pembayaran' : 'Payment Steps'}
                    </h3>
                    
                    <ol className="list-decimal pl-5 space-y-2 text-gray-700 mb-6">
                      {selectedPaymentMethod.payment_steps?.map((step: string, index: number) => (
                        <li key={index}>
                          {step.includes('account number') || step.includes('nomor rekening') 
                            ? step.replace(/account number/g, selectedPaymentMethod.account_number).replace(/nomor rekening/g, selectedPaymentMethod.account_number)
                            : step.includes('transfer amount') || step.includes('jumlah transfer')
                            ? step.replace(/transfer amount/g, formatCurrency(getTotal())).replace(/jumlah transfer/g, formatCurrency(getTotal()))
                            : step
                          }
                        </li>
                      ))}
                    </ol>
                    
                    <div className="bg-athfal-peach/10 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-athfal-pink mb-2">
                        {language === 'id' ? 'Konfirmasi Pembayaran' : 'Payment Confirmation'}
                      </h3>
                      <p className="text-gray-700 mb-2">
                        {language === 'id' 
                          ? 'Setelah melakukan pembayaran, mohon kirimkan bukti pembayaran Anda ke WhatsApp admin kami dengan menekan tombol di bawah ini.'
                          : 'After making the payment, please send your payment proof to our admin via WhatsApp by clicking the button below.'}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleConfirmPayment}
                      className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white text-lg py-6"
                    >
                      {language === 'id' ? 'Konfirmasi Pembayaran' : 'Confirm Payment'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {language === 'id' ? 'Metode pembayaran tidak ditemukan' : 'Payment method not found'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold text-athfal-pink mb-4">
                {language === 'id' ? 'Ringkasan' : 'Summary'}
              </h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Status' : 'Status'}</span>
                  <span className="text-yellow-600 font-medium">
                    {language === 'id' ? 'Menunggu Pembayaran' : 'Awaiting Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Jumlah Item' : 'Total Items'}</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Total' : 'Total'}</span>
                  <span className="font-bold text-athfal-green">{formatCurrency(getTotal())}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                {language === 'id' 
                  ? 'Pesanan Anda akan diproses setelah pembayaran dikonfirmasi oleh admin kami.'
                  : 'Your order will be processed after payment is confirmed by our admin.'}
              </p>
              
              <Separator className="my-4" />
              
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
