
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCategory } from '@/contexts/CartContext';
import { Search } from 'lucide-react';

// Define mock products
const MOCK_PRODUCTS = {
  'pop-up-class': [
    {
      id: 'pop1',
      name: 'Pop Up Class - Usia 2-3 Tahun',
      description: 'Kelas untuk anak usia 2-3 tahun yang menyenangkan dan edukatif',
      price: 250000,
      image: 'https://images.unsplash.com/photo-1588075592405-d68745302891',
      category: 'pop-up-class' as ProductCategory,
      tax: 11,
      stock: 10,
    },
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
      id: 'pop3',
      name: 'Pop Up Class - Art and Craft',
      description: 'Kelas seni dan kerajinan tangan untuk mengembangkan kreativitas anak',
      price: 275000,
      image: 'https://images.unsplash.com/photo-1560421683-6856ea585c78',
      category: 'pop-up-class' as ProductCategory,
      tax: 11,
      stock: 12,
    },
  ],
  'bumi-class': [
    {
      id: 'bumi1',
      name: 'Bumi Class: Mengenal Alam',
      description: 'Kelas belajar mengenal alam untuk anak-anak',
      price: 300000,
      image: 'https://images.unsplash.com/photo-1590592006475-d0264ad1ee92',
      category: 'bumi-class' as ProductCategory,
      tax: 11,
      stock: 10,
    },
    {
      id: 'bumi2',
      name: 'Bumi Class: Berkebun',
      description: 'Belajar berkebun dan mengenal tanaman untuk anak-anak',
      price: 350000,
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09',
      category: 'bumi-class' as ProductCategory,
      tax: 11,
      stock: 8,
    },
  ],
  'tahsin-class': [
    {
      id: 'tahsin1',
      name: 'Tahsin Class - Pemula',
      description: 'Kelas tahsin untuk pemula, belajar dasar-dasar membaca Al-Quran',
      price: 200000,
      image: 'https://images.unsplash.com/photo-1609599006353-e629a7d01297',
      category: 'tahsin-class' as ProductCategory,
      tax: 11,
      stock: 15,
    }
  ],
  'play-kit': [
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
      id: 'kit2',
      name: 'Play Kit - Numbers',
      description: 'Kit bermain sambil belajar angka dan matematika dasar',
      price: 199000,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
      category: 'play-kit' as ProductCategory,
      tax: 11,
      stock: 15,
    }
  ],
  'consultation': [
    {
      id: 'consult1',
      name: 'Konsultasi Anak 60 Menit',
      description: 'Sesi konsultasi psikologi anak dengan ahli',
      price: 350000,
      image: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
      category: 'consultation' as ProductCategory,
      tax: 11,
      stock: 5,
    },
    {
      id: 'consult2',
      name: 'Konsultasi Anak 30 Menit',
      description: 'Sesi konsultasi singkat psikologi anak dengan ahli',
      price: 200000,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
      category: 'consultation' as ProductCategory,
      tax: 11,
      stock: 5,
    }
  ],
  'merchandise': [
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
    {
      id: 'merch2',
      name: 'Tas Athfal Playhouse',
      description: 'Tas serut dengan desain Athfal Playhouse',
      price: 85000,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
      category: 'merchandise' as ProductCategory,
      tax: 11,
      stock: 25,
    }
  ]
};

// Get category titles (for display purposes)
const getCategoryTitle = (category: string): string => {
  switch(category) {
    case 'pop-up-class':
      return 'Pop Up Class';
    case 'bumi-class':
      return 'Bumi Class';
    case 'tahsin-class':
      return 'Tahsin Class';
    case 'play-kit':
      return 'Play Kit';
    case 'consultation':
      return 'Psychological Consultation';
    case 'merchandise':
      return 'Merchandise & Others';
    default:
      return category;
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ProductListPage = () => {
  const { category } = useParams<{ category: string }>();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(MOCK_PRODUCTS[category as keyof typeof MOCK_PRODUCTS] || []);
  
  // Update filtered products when category changes or search query changes
  useEffect(() => {
    const products = MOCK_PRODUCTS[category as keyof typeof MOCK_PRODUCTS] || [];
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        product => product.name.toLowerCase().includes(query) || 
                   product.description.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [category, searchQuery]);

  // Get content based on the category (in a real app, this would come from the database)
  const getCategoryDescription = (): string => {
    switch(category) {
      case 'pop-up-class':
        return language === 'id'
          ? 'Pop Up Class adalah kelas interaktif yang dirancang untuk mengembangkan kreativitas dan keterampilan anak-anak melalui berbagai aktivitas menarik.'
          : 'Pop Up Class is an interactive class designed to develop children\'s creativity and skills through various engaging activities.';
      case 'bumi-class':
        return language === 'id'
          ? 'Bumi Class mengajarkan anak-anak tentang lingkungan dan pentingnya menjaga alam melalui aktivitas praktis dan menyenangkan.'
          : 'Bumi Class teaches children about the environment and the importance of preserving nature through practical and fun activities.';
      case 'tahsin-class':
        return language === 'id'
          ? 'Tahsin Class adalah kelas untuk belajar membaca Al-Quran dengan baik dan benar, dengan metode yang menyenangkan untuk anak-anak.'
          : 'Tahsin Class is a class for learning to read the Quran properly and correctly, with a fun method for children.';
      case 'play-kit':
        return language === 'id'
          ? 'Play Kit adalah kit bermain edukatif yang dirancang untuk membantu anak-anak belajar sambil bermain di rumah.'
          : 'Play Kit is an educational play kit designed to help children learn while playing at home.';
      case 'consultation':
        return language === 'id'
          ? 'Konsultasi psikologi anak dengan ahli untuk membantu perkembangan dan kesehatan mental anak Anda.'
          : 'Child psychology consultation with experts to help your child\'s development and mental health.';
      case 'merchandise':
        return language === 'id'
          ? 'Berbagai merchandise Athfal Playhouse yang lucu dan bermanfaat untuk anak-anak.'
          : 'Various cute and useful Athfal Playhouse merchandise for children.';
      default:
        return '';
    }
  };

  const categoryTitle = getCategoryTitle(category || '');
  const categoryDescription = getCategoryDescription();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-athfal-peach/20 py-12">
        <div className="athfal-container">
          <h1 className="text-3xl md:text-4xl font-bold text-athfal-pink mb-4">
            {categoryTitle}
          </h1>
          <p className="text-gray-700 max-w-3xl">
            {categoryDescription}
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="athfal-container py-12">
        {/* Search bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'id' ? 'Cari produk...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="athfal-input pl-10"
            />
          </div>
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === 'id' 
                ? 'Tidak ada produk ditemukan' 
                : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id}>
                <Card className="athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-athfal-pink line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="font-bold text-athfal-green">
                      {formatCurrency(product.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
