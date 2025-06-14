import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, Globe, User, ChevronDown } from "lucide-react";

const Header = () => {
  console.log('[Header] Rendering');
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
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

  const PRODUCT_CATEGORIES = [
    { id: 'pop-up-class', name: 'Pop Up Class' },
    { id: 'bumi-class', name: 'Bumi Class' },
    { id: 'tahsin-class', name: 'Tahsin Class' },
    { id: 'play-kit', name: 'Play Kit' },
    { id: 'consultation', name: 'Psychological Consultation' },
    { id: 'merchandise', name: 'Merchandise & Others' },
  ];

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="athfal-container py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png" 
              alt="Athfal Playhouse Logo" 
              className="h-10 md:h-12"
            />
          </Link>

          {/* Desktop Navigation */}
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

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5 text-athfal-pink" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('id')} className={language === 'id' ? 'bg-athfal-peach/20' : ''}>
                  Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-athfal-peach/20' : ''}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5 text-athfal-pink" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-athfal-yellow text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5 text-athfal-pink" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleProfileClick}>
                    {t('profile')}
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem>
                      <Link to="/admin" className="w-full">
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth/login">
                <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white">
                  {t('login')}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Trigger */}
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
