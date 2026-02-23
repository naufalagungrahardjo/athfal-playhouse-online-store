import { Suspense, lazy } from "react";
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

// Lazy load below-the-fold layout components
const Footer = lazy(() => import("@/components/layout/Footer"));
const WhatsAppFloatButton = lazy(() => import("@/components/WhatsAppFloatButton").then(m => ({ default: m.WhatsAppFloatButton })));

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AllProductsPage = lazy(() => import("./pages/AllProductsPage"));
const ProductListPage = lazy(() => import("./pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin components
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminWebsiteCopy = lazy(() => import("./pages/admin/AdminWebsiteCopy"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminAccounts = lazy(() => import("./pages/admin/AdminAccounts"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));

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
                      <Route path="/blog/:id" element={<BlogDetailPage />} />
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
                <Footer />
                <WhatsAppFloatButton />
              </div>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
