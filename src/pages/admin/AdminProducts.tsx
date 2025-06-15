
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';
import { ProductList } from '@/components/admin/ProductList';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { useProductActions, ProductFormData } from '@/components/admin/ProductActions';

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchProducts, handleDelete, handleProductSaved } = useProductActions(fetchAllProducts, editingProduct);

  async function fetchAllProducts() {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);

  const handleEdit = (product: ProductFormData) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
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

      <ProductDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingProduct={editingProduct}
        onProductSaved={async () => { await handleProductSaved(); await fetchAllProducts(); }}
      />
    </div>
  );
};

export default AdminProducts;
