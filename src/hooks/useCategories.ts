import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  title: string;
  slug: string;
  image: string;
  bg_color: string;
  order_num: number; // new!
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order_num", { ascending: true }); // now ordered by order_num!
    if (error) {
      toast({
        variant: "destructive",
        title: "Load Error",
        description: "Unable to fetch categories.",
      });
      setLoading(false);
      return;
    }
    setCategories(data || []);
    setLoading(false);
  }, [toast]);

  // Real-time subscription
  useEffect(() => {
    fetchCategories();
    const channel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        fetchCategories
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  // Mutations
  const addCategory = async (category: Omit<Category, "id">) => {
    const { error } = await supabase.from("categories").insert([category]);
    if (error) {
      toast({ variant: "destructive", title: "Add Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category added" });
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(updates).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Update Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category updated" });
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Delete Error", description: error.message });
    } else {
      toast({ variant: "default", title: "Category deleted" });
    }
  };

  // Move a category up/down
  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    // Find category and neighbor to swap with
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) return;
    let swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const current = categories[idx];
    const neighbor = categories[swapIdx];

    // Swap their order_num in DB
    const { error } = await supabase
      .from("categories")
      .upsert([
        { id: current.id, order_num: neighbor.order_num },
        { id: neighbor.id, order_num: current.order_num }
      ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Reorder Error",
        description: "Could not move category.",
      });
    } else {
      toast({ variant: "default", title: "Category reordered" });
      fetchCategories();
    }
  };

  return { 
    categories, 
    loading, 
    fetchCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    moveCategory // export for admin UI
  };
}
