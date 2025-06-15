
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import DeleteAccountButton from "@/components/profile/DeleteAccountButton";
import { useNavigate } from "react-router-dom";

const ProfileSidebar = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
        <DeleteAccountButton />
      </CardContent>
    </Card>
  );
};

export default ProfileSidebar;
