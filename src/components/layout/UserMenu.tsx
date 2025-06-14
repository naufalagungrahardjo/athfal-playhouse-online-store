
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const UserMenu = () => {
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) {
    return (
      <Link to="/auth/login">
        <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white">
          {t('login')}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5 text-athfal-pink" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleProfileClick}>
          {t('profile')}
        </DropdownMenuItem>
        {isAdmin() && (
          <DropdownMenuItem>
            <Link to="/admin" className="w-full">
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={logout}>
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
