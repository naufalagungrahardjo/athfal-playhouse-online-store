
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function ProductCategoriesEditor() {
  const { categories, loading } = useCategories();
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (id: string, value: string) => {
    setEdits(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [id, description] of Object.entries(edits)) {
        const { error } = await supabase
          .from('categories')
          .update({ description })
          .eq('id', id);
        if (error) throw error;
      }
      setEdits({});
      toast({ title: "Descriptions saved", description: "Category descriptions updated successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save descriptions." });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              Edit descriptions shown on product category pages
            </CardDescription>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-athfal-pink hover:bg-athfal-pink/90">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Descriptions"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground">No categories found. Add categories in the Categories Management page.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="border rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-medium">{cat.title}</h3>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={edits[cat.id] !== undefined ? edits[cat.id] : (cat.description || "")}
                  onChange={e => handleChange(cat.id, e.target.value)}
                  placeholder="Enter category description..."
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
