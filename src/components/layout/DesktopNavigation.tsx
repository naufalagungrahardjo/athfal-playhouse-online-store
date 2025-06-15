import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";
import { useNavigationCopy } from "@/hooks/useNavigationCopy";
import { NavigationLinks } from "./NavigationLinks";

const DesktopNavigation = () => {
  const { language } = useLanguage();
  const nav = useNavigationCopy();
  const { categories } = useCategories();

  const navItemClass = "text-athfal-pink font-medium hover:text-athfal-pink/80 text-sm";

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <NavigationLinks language={language} nav={nav} extraClass={navItemClass} includeLinks={["home"]} />
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
      <NavigationLinks language={language} nav={nav} extraClass={navItemClass} includeLinks={["gallery","about","blog","faq"]} />
    </nav>
  );
};

export default DesktopNavigation;
