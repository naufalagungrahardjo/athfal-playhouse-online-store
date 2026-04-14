
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  is_hidden?: boolean;
  is_sold_out?: boolean;
  active_from?: string;
  active_until?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  onEdit: (product: ProductCardData) => void;
  onDelete: (productId: string) => void;
  onToggleUpdated?: () => void;
}

export const ProductCard = ({ product, onEdit, onDelete, onToggleUpdated }: ProductCardProps) => {
  const { toast } = useToast();
  
  // Determine if product is inactive due to scheduling
  const now = new Date();
  const isScheduledFuture = product.active_from ? new Date(product.active_from) > now : false;
  const isExpired = product.active_until ? new Date(product.active_until) < now : false;
  const isScheduleInactive = isScheduledFuture || isExpired;
  
  const [isHidden, setIsHidden] = useState(product.is_hidden ?? false);
  const [isSoldOut, setIsSoldOut] = useState(product.is_sold_out ?? false);
  const [toggling, setToggling] = useState(false);

  // Sync hide state when scheduling makes product inactive
  useEffect(() => {
    setIsHidden(product.is_hidden ?? false);
  }, [product.is_hidden]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleToggle = async (field: 'is_hidden' | 'is_sold_out', value: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ [field]: value } as any)
        .eq('id', product.id);
      if (error) throw error;

      if (field === 'is_hidden') setIsHidden(value);
      else setIsSoldOut(value);

      toast({
        title: "Updated",
        description: `Product ${field === 'is_hidden' ? (value ? 'hidden' : 'visible') : (value ? 'marked sold out' : 'marked available')}`,
      });
      onToggleUpdated?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setToggling(false);
    }
  };

  return (
    <Card className={isHidden ? 'opacity-60' : ''}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4 flex-1 min-w-0">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded flex-shrink-0"
            />
            <div className="min-w-0">
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
              {/* Toggles row */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  {isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-muted-foreground">Hide</span>
                  <Switch
                    checked={isHidden}
                    onCheckedChange={(v) => handleToggle('is_hidden', v)}
                    disabled={toggling}
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sold Out</span>
                  <Switch
                    checked={isSoldOut}
                    onCheckedChange={(v) => handleToggle('is_sold_out', v)}
                    disabled={toggling}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
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
