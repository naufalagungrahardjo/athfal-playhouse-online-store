
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/utils/logger";
import { useParentMessageThreads } from "@/hooks/useParentMessages";
import { useCanAccessStudent } from "@/hooks/useCanAccessStudent";

const UserMenu = () => {
  const { t, language } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { threads, reads } = useParentMessageThreads("mine");
  const { canAccess: canAccessStudent } = useCanAccessStudent();
  const unread = user ? threads.filter(th => {
    const lr = reads[th.id];
    return !lr || new Date(th.last_activity_at) > new Date(lr);
  }).length : 0;

  // Debug logging to see what's happening with user data
  logger.log('[UserMenu] Current user:', user);
  logger.log('[UserMenu] User role:', user?.role);
  logger.log('[UserMenu] isAdmin():', isAdmin());

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
        <Button variant="ghost" size="icon" className="relative">
          <User className="h-5 w-5 text-athfal-pink" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-athfal-pink text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleProfileClick}>
          {t('profile')}
        </DropdownMenuItem>
        {canAccessStudent && (
          <DropdownMenuItem onClick={() => navigate('/student')}>
            <span className="flex items-center justify-between w-full gap-2">
              <span>{language === 'id' ? 'Siswa' : 'Student'}</span>
              {unread > 0 && <Badge className="bg-athfal-pink text-white h-5 px-1.5">{unread}</Badge>}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate('/my-orders')}>
          {language === 'id' ? 'Pesanan' : 'Orders'}
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
