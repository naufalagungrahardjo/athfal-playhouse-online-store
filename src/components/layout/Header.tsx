import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, Globe, User, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";
import DesktopNavigation from "./DesktopNavigation";
import MobileMenu from "./MobileMenu";
import { BlogSearchBar } from "./BlogSearchBar";

const Header = () => {
  console.log('[Header] Rendering');
  const { t, /*language, setLanguage*/ } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  // const { getTotalItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Check if the page has been scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="athfal-container py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <DesktopNavigation />

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search bar placed to left of LanguageSwitcher */}
            <BlogSearchBar /> {/* Should now display correctly */}
            <LanguageSwitcher />
            <CartButton />
            <UserMenu />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
