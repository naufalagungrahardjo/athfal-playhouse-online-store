import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ProductCategory = 'pop-up-class' | 'bumi-class' | 'tahsin-class' | 'play-kit' | 'consultation' | 'merchandise';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  tax: number;
  stock: number;
  schedule?: { day: string; time: string; note?: string }[] | null; // <-- Added
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

  // Load cart from localStorage on mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database products to our Product interface
      const formattedProducts: Product[] = (data || []).map(product => ({
        id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category as ProductCategory,
        tax: product.tax,
        stock: product.stock
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          product, 
          quantity 
        }];
      }
    });
  };

  // Alias for addToCart
  const addItem = addToCart;

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Alias for removeFromCart
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
