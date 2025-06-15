
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = (data || []).map(product => ({
        id: product.product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category as ProductCategory,
        tax: product.tax,
        stock: product.stock,
        schedule: product.schedule ?? null // <-- MAP SCHEDULE PROPERTY
      }));

      setProducts(formattedProducts);
      console.log('Products fetched and formatted:', formattedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch products from database"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add real-time subscription for products
  useEffect(() => {
    fetchProducts();

    // Set up real-time subscription
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          console.log('Products table changed, refetching...');
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getProductsByCategory = (category: ProductCategory) => {
    return products.filter(product => product.category === category);
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProductsByCategory,
    getProductById
  };
};
