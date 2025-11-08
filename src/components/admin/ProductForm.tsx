
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/contexts/CartContext';
import { ImageUpload } from '@/components/ImageUpload';
import { useCategories } from '@/hooks/useCategories';

// NO SCHEDULE FIELD in ProductFormData type!
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

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductFormData | null;
  onProductSaved: () => void;
}

export const ProductForm = ({ isOpen, onClose, editingProduct, onProductSaved }: ProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { categories } = useCategories();

  const [formData, setFormData] = useState<ProductFormData>({
    product_id: '',
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'pop-up-class',
    tax: 11,
    stock: 0,
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        id: editingProduct.id,
        product_id: editingProduct.product_id,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: editingProduct.image,
        category: editingProduct.category,
        tax: editingProduct.tax,
        stock: editingProduct.stock,
      });
    } else {
      setFormData({
        product_id: '',
        name: '',
        description: '',
        price: 0,
        image: '',
        category: 'pop-up-class',
        tax: 11,
        stock: 0,
      });
    }
  }, [editingProduct, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = supabase.auth.getUser && (await supabase.auth.getUser()).data.user;
    console.log('[ProductForm] Attempting to save product. Auth user:', user);
    console.log('[ProductForm] Data being saved:', formData);

    try {
      if (editingProduct) {
        // Ensure new images always bypass cache by appending a fresh query param
        let imageUrl = formData.image;
        const isChanged = formData.image !== editingProduct.image;
        if (formData.image && isChanged) {
          const separator = imageUrl.includes('?') ? '&' : '?';
          imageUrl = `${imageUrl}${separator}v=${Date.now()}`;
        }

        const { error } = await supabase
          .from('products')
          .update({
            product_id: formData.product_id,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            image: imageUrl,
            category: formData.category,
            tax: formData.tax,
            stock: formData.stock,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            product_id: formData.product_id,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            image: formData.image,
            category: formData.category,
            tax: formData.tax,
            stock: formData.stock
          }]);
        
        if (error) {
          console.error('[ProductForm] Error inserting new product:', error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Product created successfully"
        });
      }

      onProductSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message ? String(error.message) : "Failed to save product"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_id">Product ID</Label>
              <Input
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: ProductCategory) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <ImageUpload
            value={formData.image}
            onChange={(url) => setFormData({...formData, image: url})}
            label="Product Image"
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (IDR)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price === 0 ? '' : formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value ? Number(e.target.value) : 0})}
                placeholder="Enter price"
                required
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({...formData, tax: e.target.value === '' ? 0 : Number(e.target.value)})}
                placeholder="Enter tax percentage"
                required
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value ? Number(e.target.value) : 0})}
                placeholder="Enter stock quantity"
                required
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ... end of file
