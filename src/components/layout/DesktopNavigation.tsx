
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";

const DesktopNavigation = () => {
  const { t } = useLanguage();
  const { categories } = useCategories();

  // Match menu font size to the "Login" button (text-sm, font-medium)
  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 text-sm";

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <Link to="/" className={navItemClass}>
        {t('home')}
      </Link>

      {/* Products Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link" 
                  className={`p-0 ${navItemClass} !font-medium !bg-transparent !shadow-none flex items-center gap-1`}>
            {t('products')} <ChevronDown className="ml-1 h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white">
          {categories.map(category => (
            <DropdownMenuItem key={category.id}>
              <Link to={`/products/${category.slug}`} className="w-full text-athfal-pink text-sm font-medium">
                {category.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </nav>
  );
};

export default DesktopNavigation;
