
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
      }));

      setProducts(formattedProducts);
      logger.log('Products fetched and formatted:', formattedProducts.length);
    } catch (err) {
      logger.error('Error fetching products:', err);
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

  useEffect(() => {
    fetchProducts();

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
          logger.log('Products table changed, refetching...');
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

  // Public-facing: filter out hidden products
  const visibleProducts = products.filter(p => !p.is_hidden);

  return {
    products,
    visibleProducts,
    loading,
    error,
    fetchProducts,
    getProductsByCategory,
    getProductById
  };
};

// ... end of file
