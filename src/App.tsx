import { Suspense, lazy, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/layout/ScrollToTop";

// Retry wrapper for lazy imports — handles stale chunk errors after rebuilds
function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      if (retries > 0) {
        return new Promise<{ default: T }>((resolve) =>
          setTimeout(() => resolve(lazyRetry(factory, retries - 1) as any), 500)
        );
      }
      // Final retry failed — force reload to get fresh chunks
      window.location.reload();
      return factory();
    })
  );
}

// Lazy load below-the-fold layout components
const Footer = lazyRetry(() => import("@/components/layout/Footer"));
const WhatsAppFloatButton = lazyRetry(() => import("@/components/WhatsAppFloatButton").then(m => ({ default: m.WhatsAppFloatButton as any })));

// Lazy load components
const Index = lazyRetry(() => import("./pages/Index"));
const HomePage = lazyRetry(() => import("./pages/HomePage"));
const AboutPage = lazyRetry(() => import("./pages/AboutPage"));
const AllProductsPage = lazyRetry(() => import("./pages/AllProductsPage"));
const ProductListPage = lazyRetry(() => import("./pages/ProductListPage"));
const ProductDetailPage = lazyRetry(() => import("./pages/ProductDetailPage"));
const CartPage = lazyRetry(() => import("./pages/CartPage"));
const CheckoutPage = lazyRetry(() => import("./pages/CheckoutPage"));
import OrderDetailsPage from "./pages/OrderDetailsPage";
const BlogPage = lazyRetry(() => import("./pages/BlogPage"));
const BlogDetailPage = lazyRetry(() => import("./pages/BlogDetailPage"));
const FAQPage = lazyRetry(() => import("./pages/FAQPage"));
const GalleryPage = lazyRetry(() => import("./pages/GalleryPage"));
const AuthPage = lazyRetry(() => import("./pages/AuthPage"));
const ProfilePage = lazyRetry(() => import("./pages/ProfilePage"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

// Admin components
const AdminLayout = lazyRetry(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazyRetry(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazyRetry(() => import("./pages/admin/AdminOrders"));
const AdminBlogs = lazyRetry(() => import("./pages/admin/AdminBlogs"));
const AdminBanners = lazyRetry(() => import("./pages/admin/AdminBanners"));
const AdminTestimonials = lazyRetry(() => import("./pages/admin/AdminTestimonials"));
const AdminContent = lazyRetry(() => import("./pages/admin/AdminContent"));
const AdminUsers = lazyRetry(() => import("./pages/admin/AdminUsers"));
const AdminFAQ = lazyRetry(() => import("./pages/admin/AdminFAQ"));
const AdminPromoCodes = lazyRetry(() => import("./pages/admin/AdminPromoCodes"));
const AdminWebsiteCopy = lazyRetry(() => import("./pages/admin/AdminWebsiteCopy"));
const AdminSettings = lazyRetry(() => import("./pages/admin/AdminSettings"));
const AdminCategories = lazyRetry(() => import("./pages/admin/AdminCategories"));
const AdminAccounts = lazyRetry(() => import("./pages/admin/AdminAccounts"));
const AdminLogs = lazyRetry(() => import("./pages/admin/AdminLogs"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/products" element={<AllProductsPage />} />
                      <Route path="/products/:category" element={<ProductListPage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-details/:id" element={<OrderDetailsPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogDetailPage />} />
                      <Route path="/faq" element={<FAQPage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/:mode" element={<AuthPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="blogs" element={<AdminBlogs />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="testimonials" element={<AdminTestimonials />} />
                        <Route path="content" element={<AdminContent />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="faq" element={<AdminFAQ />} />
                        <Route path="promo-codes" element={<AdminPromoCodes />} />
                        <Route path="website-copy" element={<AdminWebsiteCopy />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="accounts" element={<AdminAccounts />} />
                        <Route path="logs" element={<AdminLogs />} />
                      </Route>
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Suspense fallback={null}>
                  <Footer />
                  <WhatsAppFloatButton />
                </Suspense>
              </div>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
