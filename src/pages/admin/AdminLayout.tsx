import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CreateImagesBucket } from '@/components/admin/CreateImagesBucket';
import { 
  BarChart3, 
  Package, 
  FileText, 
  Settings, 
  Images, 
  Home, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  Ticket
} from 'lucide-react';

const AdminLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is admin, if not redirect to home
  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/auth/login');
    }
  }, [user, isAdmin, navigate]);

  // Admin sidebar links
  const sidebarLinks = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: FileText, label: 'Blog Posts', path: '/admin/blogs' },
    { icon: Images, label: 'Banners', path: '/admin/banners' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: HelpCircle, label: 'FAQ', path: '/admin/faq' },
    { icon: CreditCard, label: 'Payment Options', path: '/admin/payments' },
    { icon: Ticket, label: 'Promo Codes', path: '/admin/promo-codes' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  // Check if a link is active
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // If not logged in as admin, don't render the admin layout
  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <CreateImagesBucket />
      
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 z-40 py-6 px-3 hidden md:block">
        <div className="mb-8 px-4">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png" 
              alt="Athfal Playhouse Logo" 
              className="h-10"
            />
          </Link>
          <div className="mt-2 text-xs text-gray-400">Admin Panel</div>
        </div>

        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActiveLink(link.path)
                  ? 'bg-athfal-pink text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <link.icon className="h-5 w-5 mr-3" />
              <span>{link.label}</span>
            </Link>
          ))}
          
          <Link to="/" className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors mt-4">
            <Home className="h-5 w-5 mr-3" />
            <span>Back to Site</span>
          </Link>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors mt-4"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden bg-gray-900 text-white w-full p-4 flex justify-between items-center fixed top-0 z-40">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png" 
            alt="Athfal Playhouse Logo" 
            className="h-8"
          />
        </Link>
        <div className="text-sm text-gray-300">Admin Panel</div>
      </div>

      {/* Main content area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen bg-gray-50">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
