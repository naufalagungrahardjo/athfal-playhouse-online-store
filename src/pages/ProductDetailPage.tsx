import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart, Product, ProductCategory } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Clock, Calendar, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { RelatedProducts } from '@/components/RelatedProducts';
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductMainSection from "@/components/product/ProductMainSection";
import ProductTabs from "@/components/product/ProductTabs";

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { language } = useLanguage();
  const { products, loading: productsLoading, getProductById } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productsLoading && id) {
      const foundProduct = getProductById(id);
      setProduct(foundProduct || null);
      setLoading(false);
    }
  }, [id, products, productsLoading, getProductById]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      // Navigate to cart page
      window.location.href = '/cart';
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading || productsLoading) {
    return (
      <div className="athfal-container py-12 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{language === 'id' ? 'Memuat...' : 'Loading...'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="athfal-container py-12 min-h-screen">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {language === 'id' ? 'Produk tidak ditemukan' : 'Product not found'}
          </h2>
          <Link to="/">
            <Button variant="outline" className="mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <ProductBreadcrumb
          productName={product.name}
          category={product.category}
          language={language}
        />

        <ProductMainSection
          product={product}
          language={language}
          addItem={addItem}
        />

        <ProductTabs
          product={product}
          language={language}
          formatCurrency={formatCurrency}
        />

        {/* Related products */}
        <RelatedProducts currentProductId={product.id} currentCategory={product.category} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
