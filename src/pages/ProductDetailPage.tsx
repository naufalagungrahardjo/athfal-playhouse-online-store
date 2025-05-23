import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart, Product, ProductCategory } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Clock, Calendar, ArrowLeft, Plus, Minus } from 'lucide-react';

// Mock products data - in a real app, this would come from an API
const MOCK_PRODUCTS: Record<string, Product> = {
  'pop1': {
    id: 'pop1',
    name: 'Pop Up Class - Usia 2-3 Tahun',
    description: 'Kelas untuk anak usia 2-3 tahun yang menyenangkan dan edukatif',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1588075592405-d68745302891',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 10,
  },
  'pop2': {
    id: 'pop2',
    name: 'Pop Up Class - Usia 4-5 Tahun',
    description: 'Kelas untuk anak usia 4-5 tahun dengan aktivitas yang lebih kompleks',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 8,
  },
  'pop3': {
    id: 'pop3',
    name: 'Pop Up Class - Seni & Kerajinan',
    description: 'Kelas seni dan kerajinan tangan untuk mengembangkan kreativitas anak',
    price: 275000,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 12,
  },
  'bumi1': {
    id: 'bumi1',
    name: 'Bumi Class: Mengenal Alam',
    description: 'Kelas belajar mengenal alam untuk anak-anak',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1590592006475-d0264ad1ee92',
    category: 'bumi-class' as ProductCategory,
    tax: 11,
    stock: 10,
  },
  'bumi2': {
    id: 'bumi2',
    name: 'Bumi Class: Berkebun Mini',
    description: 'Kelas berkebun untuk mengenalkan anak pada tanaman dan lingkungan',
    price: 325000,
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
    category: 'bumi-class' as ProductCategory,
    tax: 11,
    stock: 7,
  },
  'bumi3': {
    id: 'bumi3',
    name: 'Bumi Class: Eksplorasi Hewan',
    description: 'Kelas pengenalan berbagai jenis hewan untuk anak-anak',
    price: 340000,
    image: 'https://images.unsplash.com/photo-1591824438708-ce405f36ba3d',
    category: 'bumi-class' as ProductCategory,
    tax: 11,
    stock: 9,
  },
  'tahsin1': {
    id: 'tahsin1',
    name: 'Tahsin Class: Pengenalan Huruf Hijaiyah',
    description: 'Kelas dasar pengenalan huruf hijaiyah untuk pemula',
    price: 200000,
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675',
    category: 'tahsin-class' as ProductCategory,
    tax: 11,
    stock: 15,
  },
  'tahsin2': {
    id: 'tahsin2',
    name: 'Tahsin Class: Belajar Membaca Al-Quran',
    description: 'Kelas lanjutan untuk belajar membaca Al-Quran dengan baik dan benar',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae',
    category: 'tahsin-class' as ProductCategory,
    tax: 11,
    stock: 12,
  },
  'tahsin3': {
    id: 'tahsin3',
    name: 'Tahsin Class: Tahfidz Juz 30',
    description: 'Kelas menghafal Juz 30 untuk anak-anak',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1541964897227-5cea1d73e363',
    category: 'tahsin-class' as ProductCategory,
    tax: 11,
    stock: 8,
  },
  'kit1': {
    id: 'kit1',
    name: 'Play Kit - Alphabet Fun',
    description: 'Kit bermain sambil belajar alfabet untuk anak',
    price: 199000,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b',
    category: 'play-kit' as ProductCategory,
    tax: 11,
    stock: 20,
  },
  'kit2': {
    id: 'kit2',
    name: 'Play Kit - Numbers & Counting',
    description: 'Kit untuk belajar angka dan berhitung dengan cara menyenangkan',
    price: 195000,
    image: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf',
    category: 'play-kit' as ProductCategory,
    tax: 11,
    stock: 18,
  },
  'kit3': {
    id: 'kit3',
    name: 'Play Kit - Shapes & Colors',
    description: 'Kit untuk mengenal bentuk dan warna bagi balita',
    price: 185000,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
    category: 'play-kit' as ProductCategory,
    tax: 11,
    stock: 25,
  },
  'consult1': {
    id: 'consult1',
    name: 'Konsultasi Anak 60 Menit',
    description: 'Sesi konsultasi psikologi anak dengan ahli',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
    category: 'consultation' as ProductCategory,
    tax: 11,
    stock: 5,
  },
  'consult2': {
    id: 'consult2',
    name: 'Konsultasi Perkembangan Anak 45 Menit',
    description: 'Evaluasi dan konsultasi perkembangan anak usia dini',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    category: 'consultation' as ProductCategory,
    tax: 11,
    stock: 7,
  },
  'consult3': {
    id: 'consult3',
    name: 'Konsultasi Pendidikan 30 Menit',
    description: 'Sesi konsultasi untuk memilih metode pendidikan terbaik untuk anak',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0',
    category: 'consultation' as ProductCategory,
    tax: 11,
    stock: 10,
  },
  'merch1': {
    id: 'merch1',
    name: 'Kaos Athfal Playhouse - Anak',
    description: 'Kaos anak dengan gambar karakter Athfal Playhouse',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
    category: 'merchandise' as ProductCategory,
    tax: 11,
    stock: 30,
  },
  'merch2': {
    id: 'merch2',
    name: 'Tas Kanvas Athfal',
    description: 'Tas kanvas multifungsi dengan desain Athfal Playhouse',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1571981795722-6d0f6a92e376',
    category: 'merchandise' as ProductCategory,
    tax: 11,
    stock: 25,
  },
  'merch3': {
    id: 'merch3',
    name: 'Botol Minum Anak Athfal',
    description: 'Botol minum anak dengan gambar karakter Athfal Playhouse',
    price: 85000,
    image: 'https://images.unsplash.com/photo-1576086476234-1c5ea538c92a',
    category: 'merchandise' as ProductCategory,
    tax: 11,
    stock: 40,
  },
};

// Mock related products with proper typing
const MOCK_RELATED_PRODUCTS: Product[] = [
  {
    id: 'pop2',
    name: 'Pop Up Class - Usia 4-5 Tahun',
    description: 'Kelas untuk anak usia 4-5 tahun dengan aktivitas yang lebih kompleks',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 8,
  },
  {
    id: 'kit1',
    name: 'Play Kit - Alphabet Fun',
    description: 'Kit bermain sambil belajar alfabet untuk anak',
    price: 199000,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b',
    category: 'play-kit' as ProductCategory,
    tax: 11,
    stock: 20,
  },
  {
    id: 'merch1',
    name: 'Kaos Athfal Playhouse - Anak',
    description: 'Kaos anak dengan gambar karakter Athfal Playhouse',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
    category: 'merchandise' as ProductCategory,
    tax: 11,
    stock: 30,
  },
];

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
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch for product details
    setLoading(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      if (id && MOCK_PRODUCTS[id]) {
        setProduct(MOCK_PRODUCTS[id]);
        // Filter related products (in real app, this would come from the API)
        setRelatedProducts(MOCK_RELATED_PRODUCTS);
      }
      setLoading(false);
    }, 300);
  }, [id]);

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

  if (loading) {
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
                <p className="mb-4">
                  {language === 'id' 
                    ? 'Di Athfal Playhouse, kami percaya bahwa belajar seharusnya menyenangkan dan melibatkan. Produk ini dirancang untuk membantu anak-anak belajar sambil bermain, mengembangkan keterampilan kognitif dan motorik mereka dalam lingkungan yang menyenangkan dan mendukung.'
                    : 'At Athfal Playhouse, we believe that learning should be fun and engaging. This product is designed to help children learn while playing, developing their cognitive and motor skills in a fun and supportive environment.'}
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
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-athfal-pink">
            {language === 'id' ? 'Produk Terkait' : 'Related Products'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedProducts.map((relatedProduct) => (
              <Link to={`/product/${relatedProduct.id}`} key={relatedProduct.id}>
                <Card className="athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-athfal-pink line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    <p className="font-bold text-athfal-green">
                      {formatCurrency(relatedProduct.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
