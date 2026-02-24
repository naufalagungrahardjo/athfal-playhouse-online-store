import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";
import { useCategories } from "@/hooks/useCategories";
import { useNavigationCopy } from "@/hooks/useNavigationCopy";
import { NavigationLinks } from "./NavigationLinks";
import { useState } from "react";

const MobileMenu = () => {
  const { language, t } = useLanguage();
  const nav = useNavigationCopy();
  const { copy } = useWebsiteCopy();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleProfileClick = () => {
    close();
    navigate('/profile');
  };

  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 py-2 text-sm";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6 text-athfal-pink" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col space-y-4 mt-8" onClick={close}>
          <NavigationLinks language={language} nav={nav} extraClass={navItemClass} includeLinks={["home"]} />
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
          <NavigationLinks language={language} nav={nav} extraClass={navItemClass} includeLinks={["gallery","about","blog","faq"]} />
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
                onClick={() => { close(); logout(); }}
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
