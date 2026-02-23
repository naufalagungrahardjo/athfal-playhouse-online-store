
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';

interface ProductCardData {
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
}

interface ProductCardProps {
  product: ProductCardData;
  onEdit: (product: ProductCardData) => void;
  onDelete: (productId: string) => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="font-bold text-green-600">{formatCurrency(product.price)}</span>
                <span className="text-sm text-muted-foreground">Tax: {product.tax}%</span>
                <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                {product.first_payment > 0 && (
                  <span className="text-sm text-muted-foreground">DP: {formatCurrency(product.first_payment)}</span>
                )}
                {product.installment > 0 && (
                  <span className="text-sm text-muted-foreground">Installment: {formatCurrency(product.installment)} x {product.installment_months}mo</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
