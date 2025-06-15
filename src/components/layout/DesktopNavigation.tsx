import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";

const DesktopNavigation = () => {
  const { language } = useLanguage();
  const { copy } = useWebsiteCopy();
  const { categories } = useCategories();
  const nav = copy.navigation;

  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 text-sm";

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <Link to="/" className={navItemClass}>
        {language === "id" ? nav.home.id : nav.home.en}
      </Link>
      {/* Products Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link"
                  className={`p-0 ${navItemClass} !font-medium !bg-transparent !shadow-none flex items-center gap-1`}>
            {language === "id" ? nav.products.id : nav.products.en}
            <ChevronDown className="ml-1 h-5 w-5" />
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
    </nav>
  );
};

export default DesktopNavigation;
