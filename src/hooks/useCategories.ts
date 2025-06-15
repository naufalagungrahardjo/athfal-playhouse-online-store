
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  title: string;
  slug: string;
  image: string;
  bg_color: string;
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
      .order("created_at", { ascending: true });
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

  return { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory };
}
