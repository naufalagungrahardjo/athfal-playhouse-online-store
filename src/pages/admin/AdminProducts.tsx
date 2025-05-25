
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductList } from '@/components/admin/ProductList';

interface ProductFormData {
  id?: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  tax: number;
  stock: number;
}

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
}

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductListData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products from database...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase products error:', error);
        throw error;
      }

      console.log('Products fetched:', data);
      
      // Transform database products to match our interface
      const transformedProducts: ProductListData[] = (data || []).map(product => ({
        id: product.id,
        product_id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category as ProductCategory,
        tax: product.tax,
        stock: product.stock,
      }));

      setProducts(transformedProducts);
      console.log('Transformed products:', transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products from database"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: ProductListData) => {
    console.log('Editing product:', product);
    const editProduct: ProductFormData = {
      id: product.id,
      product_id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      tax: product.tax,
      stock: product.stock,
    };
    setEditingProduct(editProduct);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      console.log('Deleting product:', productId);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Delete product error:', error);
        throw error;
      }

      console.log('Product deleted successfully');
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      // Refresh the product list
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product"
      });
    }
  };

  const handleProductSaved = () => {
    console.log('Product saved, refreshing list...');
    fetchProducts();
    setEditingProduct(null);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Product Management</h1>
        </div>
        <div className="text-center py-12">
          <div>Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductForm
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingProduct={editingProduct}
        onProductSaved={handleProductSaved}
      />
    </div>
  );
};

export default AdminProducts;
