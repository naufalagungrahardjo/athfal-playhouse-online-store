import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";

const MobileMenu = () => {
  const { language, t } = useLanguage();
  const { copy } = useWebsiteCopy();
  const nav = copy.navigation;
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Match mobile nav items to Login button font (text-sm font-medium)
  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 py-2 text-sm";

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
            {language === "id" ? nav.home.id : nav.home.en}
          </Link>
          <div className="py-2">
            <h3 className="font-medium text-athfal-pink mb-2 text-base">
              {language === "id" ? nav.products.id : nav.products.en}
            </h3>
            <div className="pl-4 flex flex-col space-y-2">
              {categories.map(category => (
                <Link 
                  key={category.id}
                  to={`/products/${category.slug}`} 
                  className="text-athfal-pink/80 hover:text-athfal-pink text-sm font-medium"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/gallery" className={navItemClass}>
            {language === "id" ? nav.gallery.id : nav.gallery.en}
          </Link>
          <Link to="/about" className={navItemClass}>
            {language === "id" ? nav.about.id : nav.about.en}
          </Link>
          <Link to="/blog" className={navItemClass}>
            {language === "id" ? nav.blog.id : nav.blog.en}
          </Link>
          <Link to="/faq" className={navItemClass}>
            {language === "id" ? nav.faq.id : nav.faq.en}
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
