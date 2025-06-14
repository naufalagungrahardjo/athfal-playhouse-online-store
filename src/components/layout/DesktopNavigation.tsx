
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PRODUCT_CATEGORIES = [
  { id: 'pop-up-class', name: 'Pop Up Class' },
  { id: 'bumi-class', name: 'Bumi Class' },
  { id: 'tahsin-class', name: 'Tahsin Class' },
  { id: 'play-kit', name: 'Play Kit' },
  { id: 'consultation', name: 'Psychological Consultation' },
  { id: 'merchandise', name: 'Merchandise & Others' },
];

const DesktopNavigation = () => {
  const { t } = useLanguage();

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
          {PRODUCT_CATEGORIES.map(category => (
            <DropdownMenuItem key={category.id}>
              <Link to={`/products/${category.id}`} className="w-full">
                {category.name}
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
