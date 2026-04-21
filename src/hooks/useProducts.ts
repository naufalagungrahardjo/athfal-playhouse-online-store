import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/contexts/CartContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

async function fetchProductsFromDb(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch all variants to aggregate stock per product
  const { data: variantsData } = await supabase
    .from('product_variants')
    .select('product_id, stock');

  const variantStockMap: Record<string, number> = {};
  const variantCountMap: Record<string, number> = {};
  (variantsData || []).forEach((v: any) => {
    variantStockMap[v.product_id] = (variantStockMap[v.product_id] || 0) + (v.stock ?? 0);
    variantCountMap[v.product_id] = (variantCountMap[v.product_id] || 0) + 1;
  });

  return (data || []).map(product => ({
    id: product.product_id,
    dbId: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category as ProductCategory,
    tax: product.tax,
    stock: variantCountMap[product.id] > 0 ? variantStockMap[product.id] : product.stock,
    first_payment: product.first_payment,
    installment: product.installment,
    installment_months: product.installment_months,
    media: product.media as any,
    is_hidden: product.is_hidden ?? false,
    is_sold_out: product.is_sold_out ?? false,
    admission_date: product.admission_date ?? null,
    active_from: product.active_from ?? null,
    active_until: product.active_until ?? null,
  }));
}

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProductsFromDb,
  });

  // Real-time subscription to invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          logger.log('Products table changed, refetching...');
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_variants' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getProductsByCategory = (category: ProductCategory) => {
    return products.filter(product => product.category === category);
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const isProductActive = (p: Product): boolean => {
    if (p.is_hidden) return false;
    const now = new Date();
    if (p.active_from && new Date(p.active_from) > now) return false;
    if (p.active_until && new Date(p.active_until) < now) return false;
    return true;
  };

  const visibleProducts = products.filter(isProductActive);

  return {
    products,
    visibleProducts,
    loading,
    error: queryError ? 'Failed to fetch products' : null,
    fetchProducts: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    getProductsByCategory,
    getProductById,
    isProductActive,
  };
};
