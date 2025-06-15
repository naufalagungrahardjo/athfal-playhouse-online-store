import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart, Product, ProductCategory } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Clock, Calendar, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { RelatedProducts } from '@/components/RelatedProducts';

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
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/" className="text-gray-500 hover:text-athfal-pink">
            {language === 'id' ? 'Beranda' : 'Home'}
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link to={`/products/${product.category}`} className="text-gray-500 hover:text-athfal-pink">
            {product.category === 'pop-up-class' ? 'Pop Up Class' :
             product.category === 'bumi-class' ? 'Bumi Class' :
             product.category === 'tahsin-class' ? 'Tahsin Class' :
             product.category === 'play-kit' ? 'Play Kit' :
             product.category === 'consultation' ? 'Psychological Consultation' :
             'Merchandise & Others'}
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">{product.name}</span>
        </div>

        {/* Product details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product image */}
          <div className="rounded-3xl overflow-hidden shadow-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
              }}
            />
          </div>

          {/* Product info */}
          <div>
            <h1 className="text-3xl font-bold text-athfal-pink mb-2">
              {product.name}
            </h1>
            
            <p className="text-2xl font-bold text-athfal-green mb-4">
              {formatCurrency(product.price)}
            </p>
            
            <p className="text-gray-700 mb-6">
              {product.description}
            </p>

            <div className="border-t border-b border-gray-200 py-4 my-6">
              <div className="flex items-center mb-4">
                <span className="font-medium text-gray-700 w-24">
                  {language === 'id' ? 'Kategori' : 'Category'}:
                </span>
                <span className="text-gray-600">
                  {product.category === 'pop-up-class' ? 'Pop Up Class' :
                   product.category === 'bumi-class' ? 'Bumi Class' :
                   product.category === 'tahsin-class' ? 'Tahsin Class' :
                   product.category === 'play-kit' ? 'Play Kit' :
                   product.category === 'consultation' ? 'Psychological Consultation' :
                   'Merchandise & Others'}
                </span>
              </div>

              <div className="flex items-center mb-4">
                <span className="font-medium text-gray-700 w-24">
                  {language === 'id' ? 'Stok' : 'Stock'}:
                </span>
                <span className={`${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 
                    ? (language === 'id' ? `${product.stock} tersedia`  : `${product.stock} available`) 
                    : (language === 'id' ? 'Habis' : 'Out of stock')}
                </span>
              </div>

              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-24">
                  {language === 'id' ? 'Pajak' : 'Tax'}:
                </span>
                <span className="text-gray-600">
                  {product.tax}%
                </span>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-6">
              <label className="font-medium text-gray-700 block mb-2">
                {language === 'id' ? 'Jumlah' : 'Quantity'}:
              </label>
              <div className="flex items-center">
                <Button
                  variant="outline" 
                  size="icon"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-4 w-10 text-center">{quantity}</span>
                <Button
                  variant="outline" 
                  size="icon"
                  onClick={increaseQuantity}
                  disabled={product.stock <= quantity}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 border-athfal-pink text-athfal-pink hover:bg-athfal-pink/10"
                disabled={product.stock <= 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
              </Button>
              <Button 
                onClick={handleBuyNow}
                className="flex-1 bg-athfal-pink hover:bg-athfal-pink/80 text-white"
                disabled={product.stock <= 0}
              >
                {language === 'id' ? 'Beli Sekarang' : 'Buy Now'}
              </Button>
            </div>
          </div>
        </div>

        {/* Product details tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b">
              <TabsTrigger value="description" className="px-8">
                {language === 'id' ? 'Deskripsi' : 'Description'}
              </TabsTrigger>
              <TabsTrigger value="details" className="px-8">
                {language === 'id' ? 'Detail' : 'Details'}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="px-8">
                {language === 'id' ? 'Jadwal' : 'Schedule'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-6">
              <div className="prose max-w-none">
                <p className="mb-4">
                  {product.description}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="details" className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-athfal-pink">
                    {language === 'id' ? 'Informasi Produk' : 'Product Information'}
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Nama' : 'Name'}:
                      </span>
                      <span className="text-gray-600">{product.name}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Kategori' : 'Category'}:
                      </span>
                      <span className="text-gray-600">
                        {product.category === 'pop-up-class' ? 'Pop Up Class' :
                         product.category === 'bumi-class' ? 'Bumi Class' :
                         product.category === 'tahsin-class' ? 'Tahsin Class' :
                         product.category === 'play-kit' ? 'Play Kit' :
                         product.category === 'consultation' ? 'Psychological Consultation' :
                         'Merchandise & Others'}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Stok' : 'Stock'}:
                      </span>
                      <span className="text-gray-600">{product.stock}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-athfal-pink">
                    {language === 'id' ? 'Informasi Harga' : 'Price Information'}
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Harga' : 'Price'}:
                      </span>
                      <span className="text-gray-600">{formatCurrency(product.price)}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Pajak' : 'Tax'}:
                      </span>
                      <span className="text-gray-600">{product.tax}%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium text-gray-700 w-32">
                        {language === 'id' ? 'Total (1 item)' : 'Total (1 item)'}:
                      </span>
                      <span className="text-gray-600">{formatCurrency(product.price + (product.price * product.tax / 100))}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="schedule" className="py-6">
              {product.category.includes('class') ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-3 text-athfal-pink">
                    {language === 'id' ? 'Jadwal Kelas' : 'Class Schedule'}
                  </h3>
                  <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
                    <Calendar className="text-athfal-pink mr-3 mt-1" />
                    <div>
                      <p className="font-medium">{language === 'id' ? 'Hari' : 'Day'}: Senin & Rabu</p>
                      <p className="text-gray-600">{language === 'id' ? 'Waktu' : 'Time'}: 10:00 - 11:30 WIB</p>
                    </div>
                  </div>
                  
                  <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
                    <Calendar className="text-athfal-pink mr-3 mt-1" />
                    <div>
                      <p className="font-medium">{language === 'id' ? 'Hari' : 'Day'}: Selasa & Kamis</p>
                      <p className="text-gray-600">{language === 'id' ? 'Waktu' : 'Time'}: 15:00 - 16:30 WIB</p>
                    </div>
                  </div>

                  <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
                    <Clock className="text-athfal-pink mr-3 mt-1" />
                    <div>
                      <p className="font-medium">{language === 'id' ? 'Durasi' : 'Duration'}: 8 {language === 'id' ? 'pertemuan' : 'meetings'}</p>
                      <p className="text-gray-600">{language === 'id' ? 'Mulai' : 'Starts'}: 1 Juni 2023</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  {language === 'id' 
                    ? 'Tidak ada informasi jadwal untuk produk ini.' 
                    : 'No schedule information for this product.'}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Related products */}
        <RelatedProducts currentProductId={product.id} currentCategory={product.category} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
