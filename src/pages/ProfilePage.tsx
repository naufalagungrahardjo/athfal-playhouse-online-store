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
import { supabase } from '@/integrations/supabase/client';
import { User, ShoppingBag, CreditCard } from 'lucide-react';
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import ProfileDetailsForm from "@/components/profile/ProfileDetailsForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import OrderHistoryPanel from "@/components/profile/OrderHistoryPanel";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

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
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{
    phone: string;
    address: string;
  }>({ phone: '', address: '' });

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('phone, address')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setUserProfile({
            phone: data.phone || '',
            address: data.address || ''
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Will redirect due to the useEffect hook
  }

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <Tabs defaultValue="profile" className="w-full">
          <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <ProfileSidebar />
          </div>
          {/* Main content */}
          <div className="w-full md:w-3/4">
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'id' ? 'Detail Profil' : 'Profile Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileDetailsForm
                      initialName={user.name}
                      initialEmail={user.email}
                      initialPhone={userProfile.phone}
                      initialAddress={userProfile.address}
                    />
                  </CardContent>
                </Card>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      {language === 'id' ? 'Perubahan Password' : 'Password Change'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PasswordChangeForm />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="orders">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>
                      {language === 'id' ? 'Riwayat Pesanan' : 'Order History'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderHistoryPanel />
                  </CardContent>
                </Card>
              </TabsContent>
            
          </div>
        </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
