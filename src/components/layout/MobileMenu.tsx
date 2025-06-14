
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

const PRODUCT_CATEGORIES = [
  { id: 'pop-up-class', name: 'Pop Up Class' },
  { id: 'bumi-class', name: 'Bumi Class' },
  { id: 'tahsin-class', name: 'Tahsin Class' },
  { id: 'play-kit', name: 'Play Kit' },
  { id: 'consultation', name: 'Psychological Consultation' },
  { id: 'merchandise', name: 'Merchandise & Others' },
];

const MobileMenu = () => {
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6 text-athfal-pink" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col space-y-4 mt-8">
          <Link to="/" className="text-athfal-pink font-medium hover:text-athfal-pink/80 py-2">
            {t('home')}
          </Link>

          <div className="py-2">
            <h3 className="font-medium text-athfal-pink mb-2">{t('products')}</h3>
            <div className="pl-4 flex flex-col space-y-2">
              {PRODUCT_CATEGORIES.map(category => (
                <Link 
                  key={category.id}
                  to={`/products/${category.id}`} 
                  className="text-athfal-pink/80 hover:text-athfal-pink"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
          
          <Link to="/gallery" className="text-athfal-pink font-medium hover:text-athfal-pink/80 py-2">
            {t('gallery')}
          </Link>
          
          <Link to="/about" className="text-athfal-pink font-medium hover:text-athfal-pink/80 py-2">
            {t('about')}
          </Link>
          
          <Link to="/blog" className="text-athfal-pink font-medium hover:text-athfal-pink/80 py-2">
            {t('blog')}
          </Link>
          
          <Link to="/faq" className="text-athfal-pink font-medium hover:text-athfal-pink/80 py-2">
            {t('faq')}
          </Link>

          {!user && (
            <div className="pt-4">
              <Link to="/auth/login">
                <Button className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white">
                  {t('login')}
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleProfileClick}
              >
                {t('profile')}
              </Button>
              {isAdmin() && (
                <Link to="/admin">
                  <Button variant="outline" className="w-full">
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={logout}
              >
                {t('logout')}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
