
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

export type ProductCategory = 
  | 'pop-up-class'
  | 'bumi-class'
  | 'tahsin-class'
  | 'play-kit'
  | 'consultation'
  | 'merchandise';

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: ProductCategory;
  tax: number; // Tax percentage
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
};

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
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse stored cart', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity: number) => {
    setItems(currentItems => {
      // Check if the item is already in the cart
      const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };

        toast({
          title: "Produk diperbarui",
          description: `${product.name} jumlahnya diperbarui di keranjang`,
        });

        return updatedItems;
      } else {
        // Add new item
        toast({
          title: "Produk ditambahkan",
          description: `${product.name} ditambahkan ke keranjang`,
        });

        return [...currentItems, { product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => {
      const itemToRemove = currentItems.find(item => item.product.id === productId);
      
      if (itemToRemove) {
        toast({
          title: "Produk dihapus",
          description: `${itemToRemove.product.name} dihapus dari keranjang`,
        });
      }
      
      return currentItems.filter(item => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Keranjang kosong",
      description: "Semua produk telah dihapus dari keranjang",
    });
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTaxAmount = () => {
    return items.reduce((total, item) => {
      const itemTax = (item.product.price * item.quantity) * (item.product.tax / 100);
      return total + itemTax;
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal() + getTaxAmount();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal,
        getTaxAmount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
