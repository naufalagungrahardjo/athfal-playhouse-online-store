
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Copy, Check } from 'lucide-react';

// Mock payment methods - in a real app, this would come from an API
const PAYMENT_METHODS = [
  {
    id: 'hijra',
    name: 'Bank Hijra',
    number: '7800110100142022',
    accountName: 'Fadhilah Ramadhannisa',
    logo: 'https://logosmarcas.net/wp-content/uploads/2021/03/BCA-Logo.png', // Replace with actual logo
  },
  {
    id: 'bca',
    name: 'BCA',
    number: '0123456789',
    accountName: 'Athfal Playhouse',
    logo: 'https://logosmarcas.net/wp-content/uploads/2021/03/BCA-Logo.png', // Replace with actual logo
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    number: '9876543210',
    accountName: 'Athfal Playhouse',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Bank_Jago_logo.svg', // Replace with actual logo
  }
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items, getSubtotal, getTaxAmount, getTotal, clearCart } = useCart();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('hijra'); // Default to Bank Hijra
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Fill user info if logged in
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleCopyAccountNumber = () => {
    const selectedMethod = PAYMENT_METHODS.find(method => method.id === selectedPayment);
    if (selectedMethod) {
      navigator.clipboard.writeText(selectedMethod.number);
      setCopiedAccountNumber(true);
      toast({
        title: language === 'id' ? 'Disalin ke clipboard' : 'Copied to clipboard',
        description: language === 'id' ? 'Nomor rekening telah disalin' : 'Account number has been copied',
      });
      
      // Reset copy icon after 2 seconds
      setTimeout(() => {
        setCopiedAccountNumber(false);
      }, 2000);
    }
  };

  const handleConfirmPayment = async () => {
    if (!name || !email || !phone) {
      toast({
        variant: "destructive",
        title: language === 'id' ? 'Informasi tidak lengkap' : 'Incomplete information',
        description: language === 'id' 
          ? 'Silakan lengkapi nama, email, dan nomor telepon Anda' 
          : 'Please complete your name, email, and phone number',
      });
      return;
    }

    setIsLoading(true);

    // Get selected payment method
    const paymentMethod = PAYMENT_METHODS.find(method => method.id === selectedPayment);

    try {
      // Format items for WhatsApp message
      const itemsList = items.map(item => 
        `${item.product.name} (${item.quantity}x) - ${formatCurrency(item.product.price * item.quantity)}`
      ).join('\n');

      // Construct WhatsApp message
      const message = `
*${language === 'id' ? 'ORDER ATHFAL PLAYHOUSE' : 'ATHFAL PLAYHOUSE ORDER'}*

*${language === 'id' ? 'Detail Pelanggan' : 'Customer Details'}:*
${language === 'id' ? 'Nama' : 'Name'}: ${name}
Email: ${email}
${language === 'id' ? 'Telepon' : 'Phone'}: ${phone}
${address ? `${language === 'id' ? 'Alamat' : 'Address'}: ${address}` : ''}

*${language === 'id' ? 'Detail Pesanan' : 'Order Details'}:*
${itemsList}

*${language === 'id' ? 'Subtotal' : 'Subtotal'}: ${formatCurrency(getSubtotal())}*
*${language === 'id' ? 'Pajak' : 'Tax'}: ${formatCurrency(getTaxAmount())}*
*${language === 'id' ? 'Total' : 'Total'}: ${formatCurrency(getTotal())}*

*${language === 'id' ? 'Metode Pembayaran' : 'Payment Method'}:*
${paymentMethod?.name} - ${paymentMethod?.number} (${paymentMethod?.accountName})

${notes ? `*${language === 'id' ? 'Catatan' : 'Notes'}:*\n${notes}` : ''}

${language === 'id' ? 'Terima kasih telah berbelanja di Athfal Playhouse!' : 'Thank you for shopping at Athfal Playhouse!'}
      `;

      // Encode the message for WhatsApp
      const encodedMessage = encodeURIComponent(message.trim());
      const whatsappNumber = '082120614748'; // Use the contact details from your context
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/^0/, '62')}?text=${encodedMessage}`;

      // Clear cart and redirect to WhatsApp
      clearCart();
      window.open(whatsappUrl, '_blank');

      // Show success message
      toast({
        title: language === 'id' ? 'Pesanan Berhasil' : 'Order Successful',
        description: language === 'id' 
          ? 'Silakan selesaikan pembayaran melalui WhatsApp.' 
          : 'Please complete your payment via WhatsApp.',
      });

      // Navigate back to home page
      navigate('/');
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        variant: "destructive",
        title: language === 'id' ? 'Gagal memproses pesanan' : 'Failed to process order',
        description: language === 'id'
          ? 'Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.'
          : 'An error occurred while processing your order. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <div className="flex items-center mb-8">
          <Link to="/cart" className="flex items-center text-athfal-pink hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'id' ? 'Kembali ke Keranjang' : 'Back to Cart'}
          </Link>
          <h1 className="text-3xl font-bold text-athfal-pink ml-auto">
            {language === 'id' ? 'Checkout' : 'Checkout'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-3xl shadow-md overflow-hidden mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-athfal-pink mb-4">
                  {language === 'id' ? 'Informasi Pelanggan' : 'Customer Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {language === 'id' ? 'Nama Lengkap' : 'Full Name'} *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={language === 'id' ? 'Masukkan nama lengkap' : 'Enter full name'}
                      required
                      className="athfal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'id' ? 'Masukkan email' : 'Enter email'}
                      required
                      className="athfal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {language === 'id' ? 'Nomor Telepon' : 'Phone Number'} *
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={language === 'id' ? 'Masukkan nomor telepon' : 'Enter phone number'}
                      required
                      className="athfal-input"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">
                      {language === 'id' ? 'Alamat' : 'Address'}
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={language === 'id' ? 'Masukkan alamat lengkap (opsional)' : 'Enter full address (optional)'}
                      className="min-h-24 rounded-3xl border border-athfal-peach/50 p-3 focus:border-athfal-pink focus:outline-none focus:ring-2 focus:ring-athfal-pink/30"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">
                      {language === 'id' ? 'Catatan' : 'Notes'}
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'id' ? 'Catatan tambahan untuk pesanan Anda (opsional)' : 'Additional notes for your order (optional)'}
                      className="min-h-24 rounded-3xl border border-athfal-peach/50 p-3 focus:border-athfal-pink focus:outline-none focus:ring-2 focus:ring-athfal-pink/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white rounded-3xl shadow-md overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-athfal-pink mb-4">
                  {language === 'id' ? 'Metode Pembayaran' : 'Payment Method'}
                </h2>

                <RadioGroup 
                  value={selectedPayment}
                  onValueChange={setSelectedPayment}
                  className="space-y-4"
                >
                  {PAYMENT_METHODS.map(method => (
                    <div 
                      key={method.id}
                      className={`flex items-center justify-between border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedPayment === method.id 
                          ? 'border-athfal-pink bg-athfal-pink/5' 
                          : 'border-gray-200 hover:border-athfal-pink/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mr-4" />
                        <div>
                          <Label 
                            htmlFor={`payment-${method.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {method.name}
                          </Label>
                          <div className="text-sm text-gray-600 mt-1">
                            {method.number} - {method.accountName}
                          </div>
                        </div>
                      </div>
                      {selectedPayment === method.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleCopyAccountNumber}
                          type="button"
                        >
                          {copiedAccountNumber ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    {language === 'id' 
                      ? 'Setelah melakukan pembayaran, silakan konfirmasi melalui WhatsApp dengan menekan tombol "Konfirmasi Pembayaran".'
                      : 'After making the payment, please confirm via WhatsApp by clicking the "Confirm Payment" button.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white rounded-3xl shadow-md overflow-hidden sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-athfal-pink mb-4">
                  {language === 'id' ? 'Ringkasan Pesanan' : 'Order Summary'}
                </h3>

                {/* Items list */}
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
                        <h4 className="font-medium text-gray-800 line-clamp-1">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {language === 'id' ? 'Jumlah' : 'Quantity'}: {item.quantity}
                        </p>
                        <p className="font-medium text-athfal-green mt-1">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Subtotal' : 'Subtotal'}</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'id' ? 'Pajak' : 'Tax'}</span>
                    <span>{formatCurrency(getTaxAmount())}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold">
                    <span>{language === 'id' ? 'Total' : 'Total'}</span>
                    <span className="text-athfal-green">{formatCurrency(getTotal())}</span>
                  </div>
                </div>

                {/* Confirm payment button */}
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={isLoading}
                  className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white text-lg py-6"
                >
                  {isLoading
                    ? (language === 'id' ? 'Memproses...' : 'Processing...')
                    : (language === 'id' ? 'Konfirmasi Pembayaran' : 'Confirm Payment')}
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  {language === 'id' 
                    ? 'Anda akan diarahkan ke WhatsApp untuk konfirmasi pembayaran'
                    : 'You will be redirected to WhatsApp for payment confirmation'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
