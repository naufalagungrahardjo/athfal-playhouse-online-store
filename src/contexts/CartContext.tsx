
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ProductCategory = string;

// NOTE: schedule property has been fully removed from Product interface
export interface Product {
  id: string;
  dbId: string; // UUID from products.id for variant lookups
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
  media?: Array<{ url: string; type: 'image' | 'video' }>;
  is_hidden?: boolean;
  is_sold_out?: boolean;
  admission_date?: string | null;
  active_from?: string | null;
  active_until?: string | null;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotalPrice: () => number;
  getTaxAmount: () => number;
  getTotalTax: () => number;
  getTotal: () => number;
  products: Product[];
  fetchProducts: () => Promise<void>;
  refreshCartStock: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
    fetchProducts();
  }, []);

  // Realtime stock sync: update cart items when product stock changes
  useEffect(() => {
    const channel = supabase
      .channel('cart-stock-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const updated = payload.new as any;
          // Update stock and sold-out status in cart items that match this product
          setItems(prev => prev.map(item => {
            const baseId = item.product.id.split('__')[0];
            // Only update base/non-variant lines from product table
            const isVariantLine = item.product.id.includes('__variant_');
            return baseId === updated.product_id && !isVariantLine
              ? { ...item, product: { ...item.product, stock: updated.stock, is_sold_out: updated.is_sold_out ?? false, is_hidden: updated.is_hidden ?? false } }
              : item;
          }));
          // Also update products list
          setProducts(prev => prev.map(p =>
            p.id === updated.product_id
              ? { ...p, stock: updated.stock, is_sold_out: updated.is_sold_out ?? false, is_hidden: updated.is_hidden ?? false }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'product_variants' },
        (payload) => {
          const updated = payload.new as any;
          const variantTag = `__variant_${updated.id}`;
          setItems(prev => prev.map(item => {
            if (!item.product.id.endsWith(variantTag)) return item;
            const newStock = updated.is_sold_out ? 0 : (updated.stock ?? 0);
            return { ...item, product: { ...item.product, stock: newStock, is_sold_out: !!updated.is_sold_out } };
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // schedule property completely removed here
      const formattedProducts: Product[] = (data || []).map(product => ({
        id: product.product_id,
        dbId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category as ProductCategory,
        tax: product.tax,
        stock: product.stock,
        first_payment: product.first_payment,
        installment: product.installment,
        installment_months: product.installment_months,
        media: product.media as any,
        is_hidden: product.is_hidden ?? false,
        is_sold_out: product.is_sold_out ?? false,
        active_from: product.active_from ?? null,
        active_until: product.active_until ?? null,
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;
    if (product.is_hidden) return;
    const now = new Date();
    if (product.active_from && new Date(product.active_from) > now) return;
    if (product.active_until && new Date(product.active_until) < now) return;
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const newQty = Math.min(currentQty + quantity, product.stock);
      if (newQty <= currentQty) {
        return prev; // Already at max stock
      }
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQty }
            : item
        );
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: product.price,
          product,
          quantity: Math.min(quantity, product.stock)
        }];
      }
    });
  };

  const addItem = addToCart;

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const removeItem = removeFromCart;

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string): number => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = (): number => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalPrice = (): number => {
    return getSubtotal();
  };

  const getTaxAmount = (): number => {
    return items.reduce((total, item) => {
      const itemTotal = item.product.price * item.quantity;
      const taxAmount = (itemTotal * item.product.tax) / 100;
      return total + taxAmount;
    }, 0);
  };

  const getTotalTax = (): number => {
    return getTaxAmount();
  };

  const getTotal = (): number => {
    return getSubtotal() + getTaxAmount();
  };

  const refreshCartStock = async () => {
    if (items.length === 0) return;
    const baseIds = [...new Set(
      items.filter(i => !i.product.id.includes('__variant_'))
           .map(item => item.product.id.split('__')[0])
    )];
    const variantIds = [...new Set(
      items.filter(i => i.product.id.includes('__variant_'))
           .map(i => i.product.id.split('__variant_')[1])
    )];

    const [productsRes, variantsRes] = await Promise.all([
      baseIds.length
        ? supabase.from('products').select('product_id, stock, is_sold_out, is_hidden').in('product_id', baseIds)
        : Promise.resolve({ data: [] as any[] }),
      variantIds.length
        ? supabase.from('product_variants').select('id, stock, is_sold_out').in('id', variantIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const productMap = new Map(((productsRes as any).data || []).map((p: any) => [p.product_id, p]));
    const variantMap = new Map(((variantsRes as any).data || []).map((v: any) => [v.id, v]));

    setItems(prev => prev.map(item => {
      if (item.product.id.includes('__variant_')) {
        const vid = item.product.id.split('__variant_')[1];
        const fresh: any = variantMap.get(vid);
        if (fresh) {
          const newStock = fresh.is_sold_out ? 0 : (fresh.stock ?? 0);
          return { ...item, product: { ...item.product, stock: newStock, is_sold_out: !!fresh.is_sold_out } };
        }
        return item;
      }
      const baseId = item.product.id.split('__')[0];
      const fresh: any = productMap.get(baseId);
      if (fresh) {
        return {
          ...item,
          product: {
            ...item.product,
            stock: fresh.stock,
            is_sold_out: fresh.is_sold_out ?? false,
            is_hidden: fresh.is_hidden ?? false,
          },
        };
      }
      return item;
    }));
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addItem,
        removeFromCart,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        getTotalItems,
        getSubtotal,
        getTotalPrice,
        getTaxAmount,
        getTotalTax,
        getTotal,
        products,
        fetchProducts,
        refreshCartStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ... end of file
