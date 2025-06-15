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
  schedule?: { day: string; time: string; note?: string }[] | null; // <-- Added
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

  const [formData, setFormData] = useState<ProductFormData>({
    product_id: '',
    name: '',
    description: '', // <-- NO default 'Athfal Playhouse' string, just empty
    price: 0,
    image: '',
    category: 'pop-up-class',
    tax: 11,
    stock: 0,
  });

  // Update form data when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        id: editingProduct.id,
        product_id: editingProduct.product_id,
        name: editingProduct.name,
        description: editingProduct.description, // use only the product's own description
        price: editingProduct.price,
        image: editingProduct.image,
        category: editingProduct.category,
        tax: editingProduct.tax,
        stock: editingProduct.stock,
        schedule: editingProduct.schedule
      });
    } else {
      // Reset form for new product, but no default description!
      setFormData({
        product_id: '',
        name: '',
        description: '', // Make sure to keep it blank
        price: 0,
        image: '',
        category: 'pop-up-class',
        tax: 11,
        stock: 0,
      });
    }
  }, [editingProduct, isOpen]);

  // Schedule array management for admin
  const [scheduleArray, setScheduleArray] = useState<{ day: string; time: string; note?: string }[]>([]);

  useEffect(() => {
    // Pull schedule from product if present
    if (editingProduct && editingProduct.schedule) {
      setScheduleArray(Array.isArray(editingProduct.schedule) ? editingProduct.schedule : []);
    } else {
      setScheduleArray([]);
    }
  }, [editingProduct, isOpen]);

  const handleScheduleChange = (idx: number, key: string, value: string) => {
    setScheduleArray(prev => prev.map((item, i) => (
      i === idx ? { ...item, [key]: value } : item
    )));
  };

  const handleAddSchedule = () => {
    setScheduleArray(prev => [...prev, { day: '', time: '', note: '' }]);
  };

  const handleRemoveSchedule = (idx: number) => {
    setScheduleArray(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add diagnostic logging
    const user = supabase.auth.getUser && (await supabase.auth.getUser()).data.user;
    console.log('[ProductForm] Attempting to save product. Auth user:', user);
    console.log('[ProductForm] Data being saved:', formData);

    try {
      if (editingProduct) {
        // Update existing product, now with schedule
        const { error } = await supabase
          .from('products')
          .update({
            // ... keep previous fields ...
            product_id: formData.product_id,
            name: formData.name,
            description: formData.description,
            price: formData.price,
            image: formData.image,
            category: formData.category,
            tax: formData.tax,
            stock: formData.stock,
            schedule: scheduleArray.length ? scheduleArray : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        // Create new product, now with schedule
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
            stock: formData.stock,
            schedule: scheduleArray.length ? scheduleArray : null
          }]);
        
        if (error) {
          // More detailed error log if row insertion fails
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
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product"
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
                  <SelectItem value="pop-up-class">Pop Up Class</SelectItem>
                  <SelectItem value="bumi-class">Bumi Class</SelectItem>
                  <SelectItem value="tahsin-class">Tahsin Class</SelectItem>
                  <SelectItem value="play-kit">Play Kit</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="merchandise">Merchandise</SelectItem>
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
                value={formData.tax === 0 ? '' : formData.tax}
                onChange={(e) => setFormData({...formData, tax: e.target.value ? Number(e.target.value) : 11})}
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

          {/* Schedule Section */}
          <div>
            <Label>Product Schedule (Optional)</Label>
            {scheduleArray.length === 0 && (
              <p className="text-sm text-gray-400 mb-2">No schedule blocks added. Click "Add Schedule" to create one.</p>
            )}
            <div className="space-y-2">
              {scheduleArray.map((sched, idx) => (
                <div key={idx} className="border rounded p-3 bg-muted/40 flex flex-col gap-2 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(idx)}
                    className="absolute right-2 top-2 text-athfal-pink text-xs px-1 hover:underline"
                  >
                    Remove
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`sched_day_${idx}`}>Day</Label>
                      <Input
                        id={`sched_day_${idx}`}
                        value={sched.day}
                        onChange={e => handleScheduleChange(idx, "day", e.target.value)}
                        placeholder="E.g. Monday"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sched_time_${idx}`}>Time</Label>
                      <Input
                        id={`sched_time_${idx}`}
                        value={sched.time}
                        onChange={e => handleScheduleChange(idx, "time", e.target.value)}
                        placeholder="E.g. 10:00 - 11:30 WIB"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sched_note_${idx}`}>Note</Label>
                      <Input
                        id={`sched_note_${idx}`}
                        value={sched.note || ''}
                        onChange={e => handleScheduleChange(idx, "note", e.target.value)}
                        placeholder="(optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSchedule} className="mt-2">
              + Add Schedule
            </Button>
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
