
import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useOrderDetails } from '@/hooks/useOrderDetails';
import { useWebsiteCopy } from '@/hooks/useWebsiteCopy';
import { PaymentTimeoutPage } from '@/components/PaymentTimeoutPage';
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
  const { paymentMethods } = useDatabase();
  const { copy } = useWebsiteCopy();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const lookupToken = searchParams.get('token') || undefined;
  const { order, loading } = useOrderDetails(id, lookupToken);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);

  // Get the payment method from order data
  useEffect(() => {
    if (order && paymentMethods.length > 0) {
      const paymentMethod = paymentMethods.find(method => method.id === order.payment_method);
      if (paymentMethod) {
        setSelectedPaymentMethod(paymentMethod);
      }
    }
  }, [order, paymentMethods]);

  // Calculate time left based on order creation time
  useEffect(() => {
    if (order?.created_at) {
      const orderTime = new Date(order.created_at).getTime();
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - orderTime) / 1000);
      const remaining = Math.max(0, (30 * 60) - elapsed);
      setTimeLeft(remaining);
    }
  }, [order?.created_at]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
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
    if (!order) return;

    // Format items for WhatsApp message
    const itemsList = order.items.map(item => 
      `${item.product_name} (${item.quantity}x) - ${formatCurrency(item.product_price * item.quantity)}`
    ).join('\n');

    // Construct WhatsApp message
    const message = `
*${language === 'id' ? 'KONFIRMASI PEMBAYARAN ATHFAL PLAYHOUSE' : 'ATHFAL PLAYHOUSE PAYMENT CONFIRMATION'}*

*Order ID: ${order.id}*

*${language === 'id' ? 'Detail Pesanan' : 'Order Details'}:*
${itemsList}

*${language === 'id' ? 'Total' : 'Total'}: ${formatCurrency(order.total_amount)}*

${language === 'id' ? 'Saya telah melakukan pembayaran dan ingin mengonfirmasi pesanan saya.' : 'I have made the payment and would like to confirm my order.'}
    `;

    // Encode the message for WhatsApp
    const encodedMessage = encodeURIComponent(message.trim());
    const whatsappNumber = '082120614748';
    const formattedNumber = whatsappNumber.replace(/^0/, '62');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;
    
    // Use window.open for reliable cross-browser/iframe support
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athfal-pink mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'id' ? 'Memuat detail pesanan...' : 'Loading order details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'id' ? 'Pesanan Tidak Ditemukan' : 'Order Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {language === 'id' ? 'Pesanan yang Anda cari tidak ditemukan.' : 'The order you are looking for was not found.'}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show timeout page if time is up
  if (timeLeft <= 0) {
    return <PaymentTimeoutPage orderId={order.id} totalAmount={order.total_amount} />;
  }

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
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        {item.product_image ? (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              {language === 'id' ? 'Gambar' : 'Image'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-gray-600">
                            {language === 'id' ? 'Jumlah' : 'Quantity'}: {item.quantity}
                          </p>
                          <p className="font-medium text-athfal-green">
                            {formatCurrency(item.product_price * item.quantity)}
                          </p>
                        </div>
                        {(item.first_payment != null && item.first_payment > 0) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {language === 'id' ? 'DP' : 'First Payment'}: {formatCurrency(item.first_payment)}
                          </p>
                        )}
                        {(item.installment != null && item.installment > 0) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {language === 'id' ? 'Cicilan' : 'Installment'}: {formatCurrency(item.installment)}
                            {(item.installment_months != null && item.installment_months > 0) && (
                              <span> x{item.installment_months} {language === 'id' ? 'bulan' : 'months'}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price summary */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Subtotal' : 'Subtotal'}</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Pajak' : 'Tax'}</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'id' ? 'Diskon' : 'Discount'}</span>
                      <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>{language === 'id' ? 'Total' : 'Total'}</span>
                    <span className="text-athfal-green">{formatCurrency(order.total_amount)}</span>
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
                      {selectedPaymentMethod.image && (
                        <div className="flex justify-center mb-4">
                          <img 
                            src={selectedPaymentMethod.image} 
                            alt={selectedPaymentMethod.bank_name}
                            className="max-w-[200px] max-h-[200px] object-contain rounded-lg"
                          />
                        </div>
                      )}
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
                      {selectedPaymentMethod.payment_steps?.map((step: any, index: number) => {
                        const stepText = typeof step === 'string' ? step : (step[language] || step.id || '');
                        return (
                          <li key={index}>
                            {stepText.includes('account number') || stepText.includes('nomor rekening') 
                              ? stepText.replace(/account number/g, selectedPaymentMethod.account_number).replace(/nomor rekening/g, selectedPaymentMethod.account_number)
                              : stepText.includes('transfer amount') || stepText.includes('jumlah transfer')
                              ? stepText.replace(/transfer amount/g, formatCurrency(order.total_amount)).replace(/jumlah transfer/g, formatCurrency(order.total_amount))
                              : stepText
                            }
                          </li>
                        );
                      })}
                    </ol>
                    
                    <div className="bg-athfal-peach/10 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-athfal-pink mb-2">
                        {copy.paymentConfirmation.title[language]}
                      </h3>
                      <p className="text-gray-700 mb-2">
                        {copy.paymentConfirmation.description[language]}
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
                  <span className="text-gray-600">{language === 'id' ? 'Order ID' : 'Order ID'}</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Status' : 'Status'}</span>
                  <span className="text-yellow-600 font-medium">
                    {language === 'id' ? 'Menunggu Pembayaran' : 'Awaiting Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Jumlah Item' : 'Total Items'}</span>
                  <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'id' ? 'Total' : 'Total'}</span>
                  <span className="font-bold text-athfal-green">{formatCurrency(order.total_amount)}</span>
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
