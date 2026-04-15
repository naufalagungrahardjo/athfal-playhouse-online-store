
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';
import { ProductList } from '@/components/admin/ProductList';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { useProductActions, ProductFormData } from '@/components/admin/ProductActions';

// A helper type that ensures 'id' is required
type StrictProductFormData = ProductFormData & { id: string; };

const AdminProducts = () => {
  const [products, setProducts] = useState<StrictProductFormData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);

  // Make sure we fetch with correct types
  const { fetchProducts, handleDelete, handleProductSaved } = useProductActions(fetchAllProducts, editingProduct);

  // Fetch and typecast from Supabase
  async function fetchAllProducts() {
    setLoading(true);
    const data = await fetchProducts();
    const formatted: StrictProductFormData[] = (data || []).map((p: any) => ({
      id: p.id,
      product_id: p.product_id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      media: p.media,
      category: p.category as ProductCategory,
      tax: p.tax,
      stock: p.stock,
      first_payment: p.first_payment ?? 0,
      installment: p.installment ?? 0,
      installment_months: p.installment_months ?? 0,
      is_hidden: p.is_hidden ?? false,
      is_sold_out: p.is_sold_out ?? false,
      admission_date: p.admission_date ?? '',
      active_from: p.active_from ?? '',
      active_until: p.active_until ?? '',
    }));
    setProducts(formatted);
    setLoading(false);
  }

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);

  const handleEdit = (product: StrictProductFormData) => {
    console.log('[AdminProducts] handleEdit called with product:', JSON.stringify(product));
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (product: StrictProductFormData) => {
    const duplicated: ProductFormData = {
      ...product,
      id: undefined,
      product_id: product.product_id + '-copy',
      name: product.name + ' (Copy)',
    };
    setEditingProduct(duplicated);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const exportProductsCSV = () => {
    const headers = ["Product ID", "Name", "Description", "Category", "Price", "Tax %", "Stock", "First Payment", "Installment", "Installment Months"];
    const rows = products.map(p => [
      p.product_id, p.name, p.description, p.category, String(p.price), String(p.tax), String(p.stock),
      String(p.first_payment), String(p.installment), String(p.installment_months),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "products.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportProductsCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <ProductList
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleUpdated={fetchAllProducts}
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
