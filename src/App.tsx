import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloatButton from "@/components/WhatsAppFloatButton";
import HomePage from "@/pages/HomePage";
import AboutPage from "./pages/AboutPage";
import AllProductsPage from "./pages/AllProductsPage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import FAQPage from "./pages/FAQPage";
import GalleryPage from "./pages/GalleryPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminContent from "./pages/admin/AdminContent";
import AdminWebsiteCopy from "./pages/admin/AdminWebsiteCopy";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <Routes>
                  <Route path="/admin/*" element={
                    <Routes>
                      <Route path="/" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="blogs" element={<AdminBlogs />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="content" element={<AdminContent />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="faq" element={<AdminFAQ />} />
                        <Route path="promo-codes" element={<AdminPromoCodes />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="website-copy" element={<AdminWebsiteCopy />} />
                        <Route path="settings" element={<AdminSettings />} />
                      </Route>
                    </Routes>
                  } />
                  <Route path="/*" element={
                    <>
                      <Header />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/home" element={<HomePage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/products" element={<AllProductsPage />} />
                          <Route path="/products/:category" element={<ProductListPage />} />
                          <Route path="/product/:id" element={<ProductDetailPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/order-details/:orderId" element={<OrderDetailsPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/blog/:id" element={<BlogDetailPage />} />
                          <Route path="/faq" element={<FAQPage />} />
                          <Route path="/gallery" element={<GalleryPage />} />
                          <Route path="/profile" element={<ProfilePage />} />
                          <Route path="/auth" element={<AuthPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                      <WhatsAppFloatButton />
                    </>
                  } />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
