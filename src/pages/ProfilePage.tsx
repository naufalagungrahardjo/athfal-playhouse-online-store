import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";
import { User, ShoppingBag, CreditCard } from 'lucide-react';
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";

// Mock order history data
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

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orderHistory, setOrderHistory] = useState(mockOrderHistory);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  // Handle profile update
  const handleUpdateProfile = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, this would be an API call
      toast({
        title: language === 'id' ? 'Profil diperbarui' : 'Profile updated',
        description: language === 'id' ? 'Informasi profil Anda telah diperbarui' : 'Your profile information has been updated',
      });
      setIsLoading(false);
    }, 500);
  };

  // Handle password change
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'id' ? 'Password tidak cocok' : 'Passwords do not match',
        description: language === 'id' ? 'Pastikan password baru dan konfirmasi password sama' : 'Make sure new password and confirm password are the same',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      toast({
        title: language === 'id' ? 'Field kosong' : 'Empty fields',
        description: language === 'id' ? 'Semua field harus diisi' : 'All fields must be filled in',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, this would be an API call
      toast({
        title: language === 'id' ? 'Password diperbarui' : 'Password updated',
        description: language === 'id' ? 'Password Anda telah diperbarui' : 'Your password has been updated',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    }, 500);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null; // Will redirect due to the useEffect hook
  }

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center">
                  <div className="bg-athfal-pink/20 rounded-full p-3">
                    <User className="h-6 w-6 text-athfal-pink" />
                  </div>
                  <div className="ml-3">
                    <CardTitle className="text-xl">{user.name}</CardTitle>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="profile">
                      {language === 'id' ? 'Profil' : 'Profile'}
                    </TabsTrigger>
                    <TabsTrigger value="orders">
                      {language === 'id' ? 'Pesanan' : 'Orders'}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Separator className="my-4" />

                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-500 border-red-500 hover:bg-red-50 mt-4"
                  onClick={handleLogout}
                >
                  {language === 'id' ? 'Keluar' : 'Sign Out'}
                </Button>
+               {/* Only common user can see the delete account button */}
+               <DeleteAccountButton />
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="w-full md:w-3/4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'id' ? 'Detail Profil' : 'Profile Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'id' ? 'Nama Lengkap' : 'Full Name'}
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'id' ? 'Nomor Telepon' : 'Phone Number'}
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {language === 'id' ? 'Alamat' : 'Address'}
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="bg-athfal-pink hover:bg-athfal-pink/80 text-white"
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                    >
                      {language === 'id' ? 'Perbarui Profil' : 'Update Profile'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      {language === 'id' ? 'Perubahan Password' : 'Password Change'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">
                        {language === 'id' ? 'Password Lama' : 'Current Password'}
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">
                        {language === 'id' ? 'Password Baru' : 'New Password'}
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        {language === 'id' ? 'Konfirmasi Password' : 'Confirm Password'}
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={handleChangePassword}
                      disabled={isLoading}
                    >
                      {language === 'id' ? 'Perbarui Password' : 'Update Password'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>
                      {language === 'id' ? 'Riwayat Pesanan' : 'Order History'}
                    </CardTitle>
                    <ShoppingBag className="h-5 w-5 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    {orderHistory.length === 0 ? (
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
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
