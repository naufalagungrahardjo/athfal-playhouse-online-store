
import { ProductFormData } from './ProductActions';
import { ProductForm } from '@/components/admin/ProductForm';

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductFormData | null;
  onProductSaved: () => void;
}

export function ProductDialog({
  isOpen,
  onClose,
  editingProduct,
  onProductSaved
}: ProductDialogProps) {
  return (
    <ProductForm
      isOpen={isOpen}
      onClose={onClose}
      editingProduct={editingProduct}
      onProductSaved={onProductSaved}
    />
  );
}
