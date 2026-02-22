import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Category {
  id: string;
  title: string;
  slug: string;
  image: string;
  bg_color: string;
  order_num: number;
}

const fetchCategoriesFromDb = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_num", { ascending: true });
  if (error) throw error;
  return data || [];
};

export function useCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesFromDb,
  });

  // Real-time subscription to invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel("categories-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const addCategory = async (
    category: Omit<Category, "id" | "order_num"> & { order_num?: number }
  ) => {
    const categoryData = {
      ...category,
      order_num: category.order_num ?? (categories.length + 1),
    };
    const { error } = await supabase.from("categories").insert([categoryData]);
    if (error) {
      toast({ variant: "destructive", title: "Add Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category added" });
      invalidate();
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(updates).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Update Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category updated" });
      invalidate();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Delete Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category deleted" });
      invalidate();
    }
  };

  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const current = categories[idx];
    const neighbor = categories[swapIdx];

    const { error: err1 } = await supabase
      .from("categories")
      .update({ order_num: neighbor.order_num })
      .eq("id", current.id);

    const { error: err2 } = await supabase
      .from("categories")
      .update({ order_num: current.order_num })
      .eq("id", neighbor.id);

    if (err1 || err2) {
      toast({ variant: "destructive", title: "Reorder Error", description: "Could not move category." });
    } else {
      toast({ variant: "default", title: "Category reordered" });
      invalidate();
    }
  };

  return {
    categories,
    loading,
    fetchCategories: invalidate,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
  };
}
