
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert, Tables } from "@/integrations/supabase/types";

export interface Collaborator {
  id: string;
  name: string;
  logo: string;
  created_at?: string;
}

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function fetchCollaborators() {
    setLoading(true);
    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch partners" });
      setLoading(false);
      return;
    }
    setCollaborators((data ?? []) as Collaborator[]);
    setLoading(false);
  }

  async function addCollaborator(name: string, logo: string) {
    // Use the Supabase types to ensure type safety
    const insertData: TablesInsert<"collaborators"> = { name, logo };
    const { error } = await supabase.from("collaborators").insert([insertData]);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not add partner" });
      return false;
    }
    toast({ title: "Success", description: "Partner added!" });
    await fetchCollaborators();
    return true;
  }

  async function removeCollaborator(id: string) {
    const { error } = await supabase.from("collaborators").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove partner" });
      return false;
    }
    toast({ title: "Success", description: "Partner removed!" });
    await fetchCollaborators();
    return true;
  }

  useEffect(() => {
    fetchCollaborators();
    // Optional: add real-time support if needed
    // return supabase.channel(...);
  }, []);

  return { collaborators, loading, addCollaborator, removeCollaborator, fetchCollaborators };
}
