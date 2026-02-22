
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/utils/logAdminAction';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCategory } from '@/contexts/CartContext';

export interface ProductFormData {
  id?: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  media?: Array<{url: string; type: 'image' | 'video'}>;
  category: ProductCategory;
  tax: number;
  stock: number;
  first_payment: number;
  installment: number;
}

export const useProductActions = (onProductsUpdated: () => void, editingProduct: ProductFormData | null) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products from database"
      });
      return [];
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      console.log('Attempting to delete product with id:', productId);
      
      const { error, data } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();

      console.log('Delete result:', { error, data });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      await logAdminAction({
        user,
        action: `Deleted product (id: ${productId})`,
      });

      await onProductsUpdated();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete product"
      });
    }
  };

  const handleProductSaved = async () => {
    await onProductsUpdated();
    if (editingProduct) {
      await logAdminAction({
        user,
        action: `Updated product (id: ${editingProduct.id}, name: ${editingProduct.name})`,
      });
    } else {
      const productsAfter = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1);
      const recent = productsAfter.data && productsAfter.data[0];
      await logAdminAction({
        user,
        action: `Added new product${recent ? ` (id: ${recent.id}, name: ${recent.name})` : ''}`,
      });
    }
  };

  return { fetchProducts, handleDelete, handleProductSaved };
}
