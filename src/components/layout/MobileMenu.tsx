
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";

const MobileMenu = () => {
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Set all mobile nav menu items (main and categories) to text-2xl
  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 py-2 text-2xl";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6 text-athfal-pink" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col space-y-4 mt-8">
          <Link to="/" className={navItemClass}>
            {t('home')}
          </Link>

          <div className="py-2">
            <h3 className="font-medium text-athfal-pink mb-2 text-xl">{t('products')}</h3>
            <div className="pl-4 flex flex-col space-y-2">
              {categories.map(category => (
                <Link 
                  key={category.id}
                  to={`/products/${category.slug}`} 
                  className="text-athfal-pink/80 hover:text-athfal-pink text-2xl"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
          
          <Link to="/gallery" className={navItemClass}>
            {t('gallery')}
          </Link>
          
          <Link to="/about" className={navItemClass}>
            {t('about')}
          </Link>
          
          <Link to="/blog" className={navItemClass}>
            {t('blog')}
          </Link>
          
          <Link to="/faq" className={navItemClass}>
            {t('faq')}
          </Link>

          {!user && (
            <div className="pt-4">
              <Link to="/auth/login">
                <Button className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white text-lg">
                  {t('login')}
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="pt-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full text-lg"
                onClick={handleProfileClick}
              >
                {t('profile')}
              </Button>
              {isAdmin() && (
                <Link to="/admin">
                  <Button variant="outline" className="w-full text-lg">
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="destructive" 
                className="w-full text-lg"
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

