
import { Link } from 'react-router-dom';
import { ProductCategory } from '@/contexts/CartContext';

interface ProductBreadcrumbProps {
  productName: string;
  category: ProductCategory;
  language: string;
}

const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({ productName, category, language }) => (
  <div className="mb-6">
    <Link to="/" className="text-gray-500 hover:text-athfal-pink">
      {language === 'id' ? 'Beranda' : 'Home'}
    </Link>
    <span className="mx-2 text-gray-500">/</span>
    <Link to={`/products/${category}`} className="text-gray-500 hover:text-athfal-pink">
      {category === 'pop-up-class' ? 'Pop Up Class' :
        category === 'bumi-class' ? 'Bumi Class' :
        category === 'tahsin-class' ? 'Tahsin Class' :
        category === 'play-kit' ? 'Play Kit' :
        category === 'consultation' ? 'Psychological Consultation' :
        'Merchandise & Others'}
    </Link>
    <span className="mx-2 text-gray-500">/</span>
    <span className="text-gray-700">{productName}</span>
  </div>
);

export default ProductBreadcrumb;
