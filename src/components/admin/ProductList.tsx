
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '@/contexts/CartContext';

interface ProductListData {
  id: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  tax: number;
  stock: number;
  first_payment: number;
  installment: number;
  installment_months: number;
  is_hidden?: boolean;
  is_sold_out?: boolean;
  active_from?: string;
  active_until?: string;
}

interface ProductListProps {
  products: ProductListData[];
  onEdit: (product: ProductListData) => void;
  onDelete: (productId: string) => void;
  onDuplicate?: (product: ProductListData) => void;
  onToggleUpdated?: () => void;
}

export const ProductList = ({ products, onEdit, onDelete, onDuplicate, onToggleUpdated }: ProductListProps) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No products found. Add your first product!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleUpdated={onToggleUpdated}
        />
      ))}
    </div>
  );
};
