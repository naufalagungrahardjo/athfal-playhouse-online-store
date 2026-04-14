
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/contexts/CartContext';
import { useCategories } from '@/hooks/useCategories';
import { ProductMediaUpload, ProductMedia } from '@/components/admin/ProductMediaUpload';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ProductVariantManager } from '@/components/admin/ProductVariantManager';

interface ProductFormData {
  id?: string;
  product_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  media?: ProductMedia[];
  category: ProductCategory;
  tax: number;
  stock: number;
  first_payment: number;
  installment: number;
  installment_months: number;
  admission_date?: string;
  active_from?: string;
  active_until?: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductFormData | null;
  onProductSaved: () => void;
}

// Convert ISO string to { date, time } for separate inputs
const isoToDateAndTime = (iso: string): { date: string; time: string } => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

// Combine date + time strings into ISO
const dateTimeToIso = (date: string, time: string): string => {
  if (!date) return '';
  const t = time || '00:00';
  return new Date(`${date}T${t}`).toISOString();
};

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
    media: [],
    category: 'pop-up-class',
    tax: 11,
    stock: 0,
    first_payment: 0,
    installment: 0,
    installment_months: 0,
    admission_date: '',
    active_from: '',
    active_until: '',
  });

  useEffect(() => {
    console.log('[ProductForm] useEffect fired. editingProduct:', editingProduct, 'isOpen:', isOpen);
    if (editingProduct) {
      const media = editingProduct.media || [];
      // Strip cache-busting params from cover image for comparison
      let coverImage = editingProduct.image;
      const stripCacheBuster = (url: string) => url.replace(/[?&]v=\d+$/, '');
      const strippedCover = coverImage ? stripCacheBuster(coverImage) : '';
      
      // Check if the cover image exists in media (with or without cache buster)
      const coverInMedia = media.some(m => m.type === 'image' && (m.url === coverImage || stripCacheBuster(m.url) === strippedCover));
      
      if (!coverImage && media.length > 0) {
        const firstImage = media.find(m => m.type === 'image');
        coverImage = firstImage?.url || '';
      } else if (coverImage && !coverInMedia && media.length >= 0) {
        // Cover image exists but isn't in media array — use stripped version as cover
        // and ensure it's visible in the media list
        coverImage = strippedCover || coverImage;
      }
      
      setFormData({
        id: editingProduct.id,
        product_id: editingProduct.product_id,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: coverImage,
        media: media,
        category: editingProduct.category,
        tax: editingProduct.tax,
        stock: editingProduct.stock,
        first_payment: (editingProduct as any).first_payment || 0,
        installment: (editingProduct as any).installment || 0,
        installment_months: (editingProduct as any).installment_months || 0,
        admission_date: (editingProduct as any).admission_date || '',
        active_from: (editingProduct as any).active_from || '',
        active_until: (editingProduct as any).active_until || '',
      });
    } else {
      setFormData({
        product_id: '',
        name: '',
        description: '',
        price: 0,
        image: '',
        media: [],
        category: 'pop-up-class',
        tax: 11,
        stock: 0,
        first_payment: 0,
        installment: 0,
        installment_months: 0,
        admission_date: '',
        active_from: '',
        active_until: '',
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
        let imageUrl = formData.image;
        // Strip any existing cache-busting params to keep URL clean
        imageUrl = imageUrl.replace(/[?&]v=\d+$/, '');

        const { error } = await supabase
          .from('products')
          .update({
            product_id: formData.product_id,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            image: imageUrl,
            media: formData.media as any,
            category: formData.category,
            tax: formData.tax,
            stock: formData.stock,
            first_payment: formData.first_payment,
            installment: formData.installment,
            installment_months: formData.installment_months,
            admission_date: formData.admission_date || null,
            active_from: formData.active_from || null,
            active_until: formData.active_until || null,
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
            media: formData.media as any,
            category: formData.category,
            tax: formData.tax,
            stock: formData.stock,
            first_payment: formData.first_payment,
            installment: formData.installment,
            installment_months: formData.installment_months,
            admission_date: formData.admission_date || null,
            active_from: formData.active_from || null,
            active_until: formData.active_until || null,
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
            <RichTextEditor
              value={formData.description}
              onChange={(description) => setFormData({...formData, description})}
              label="Description"
            />
          </div>

          <ProductMediaUpload
            value={formData.media || []}
            onChange={(media) => {
              // If cover image is removed from media, update it
              const coverStillExists = media.some(m => m.url === formData.image);
              if (!coverStillExists && media.length > 0) {
                const firstImage = media.find(m => m.type === 'image');
                setFormData({...formData, media, image: firstImage?.url || ''});
              } else {
                setFormData({...formData, media});
              }
            }}
            coverImage={formData.image}
            onCoverChange={(url) => setFormData({...formData, image: url})}
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


          <div>
            <Label htmlFor="admission_date">Admission Date (optional)</Label>
            <Input
              id="admission_date"
              type="date"
              value={formData.admission_date || ''}
              onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Active From (optional)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={isoToDateAndTime(formData.active_from || '').date}
                  onChange={(e) => {
                    const time = isoToDateAndTime(formData.active_from || '').time || '00:00';
                    setFormData({...formData, active_from: e.target.value ? dateTimeToIso(e.target.value, time) : ''});
                  }}
                  className="flex-1 min-w-0"
                />
                <Input
                  type="time"
                  value={isoToDateAndTime(formData.active_from || '').time}
                  onChange={(e) => {
                    const date = isoToDateAndTime(formData.active_from || '').date;
                    if (date) setFormData({...formData, active_from: dateTimeToIso(date, e.target.value)});
                  }}
                  className="w-full sm:w-28 min-w-0"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave empty to publish immediately</p>
            </div>
            <div>
              <Label>Active Until (optional)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={isoToDateAndTime(formData.active_until || '').date}
                  onChange={(e) => {
                    const time = isoToDateAndTime(formData.active_until || '').time || '00:00';
                    setFormData({...formData, active_until: e.target.value ? dateTimeToIso(e.target.value, time) : ''});
                  }}
                  className="flex-1 min-w-0"
                />
                <Input
                  type="time"
                  value={isoToDateAndTime(formData.active_until || '').time}
                  onChange={(e) => {
                    const date = isoToDateAndTime(formData.active_until || '').date;
                    if (date) setFormData({...formData, active_until: dateTimeToIso(date, e.target.value)});
                  }}
                  className="w-full sm:w-28 min-w-0"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry</p>
            </div>
          </div>

          {/* Variant Manager - only for existing products */}
          <ProductVariantManager productDbId={editingProduct?.id} />

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
