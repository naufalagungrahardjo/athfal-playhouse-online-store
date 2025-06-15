import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";

const DesktopNavigation = () => {
  const { t } = useLanguage();
  const { categories } = useCategories();

  return (
    <nav className="hidden md:flex items-center space-x-6">
      <Link to="/" className="text-athfal-pink font-medium hover:text-athfal-pink/80">
        {t('home')}
      </Link>

      {/* Products Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link" className="text-athfal-pink font-medium p-0 hover:text-athfal-pink/80">
            {t('products')} <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white">
          {/* categories are now ordered by order_num in useCategories hook */}
          {categories.map(category => (
            <DropdownMenuItem key={category.id}>
              <Link to={`/products/${category.slug}`} className="w-full">
                {category.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Link to="/gallery" className="text-athfal-pink font-medium hover:text-athfal-pink/80">
        {t('gallery')}
      </Link>
      
      <Link to="/about" className="text-athfal-pink font-medium hover:text-athfal-pink/80">
        {t('about')}
      </Link>
      
      <Link to="/blog" className="text-athfal-pink font-medium hover:text-athfal-pink/80">
        {t('blog')}
      </Link>
      
      <Link to="/faq" className="text-athfal-pink font-medium hover:text-athfal-pink/80">
        {t('faq')}
      </Link>
    </nav>
  );
};

export default DesktopNavigation;
