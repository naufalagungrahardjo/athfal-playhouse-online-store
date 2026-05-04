
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

const ProfileSidebar = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center">
          <div className="bg-athfal-pink/20 rounded-full p-3">
            <User className="h-6 w-6 text-athfal-pink" />
          </div>
          <div className="ml-3">
            <CardTitle className="text-xl">{user?.name}</CardTitle>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="attendance">
            {language === 'id' ? 'Kehadiran' : 'Attendance'}
          </TabsTrigger>
          <TabsTrigger value="profile">
            {language === 'id' ? 'Profil' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="orders">
            {language === 'id' ? 'Pesanan' : 'Orders'}
          </TabsTrigger>
        </TabsList>
      </CardContent>
    </Card>
  );
};

export default ProfileSidebar;
