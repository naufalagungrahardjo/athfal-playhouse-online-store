
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import GalleryItemForm from "../gallery/GalleryItemForm";
import { useGalleryContent, GalleryItem } from "@/hooks/useGalleryContent";
import { useState } from "react";

const GalleryAdminTab = () => {
  const {
    content: galleryContent,
    saveContent: saveGalleryContent,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
  } = useGalleryContent();

  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [showAddGalleryForm, setShowAddGalleryForm] = useState(false);

  const handleGalleryContentChange = (field: keyof typeof galleryContent, language: 'id' | 'en', value: string) => {
    const currentField = galleryContent[field];
    if (typeof currentField === 'object' && currentField !== null && 'id' in currentField && 'en' in currentField) {
      const updatedContent = {
        ...galleryContent,
        [field]: {
          ...currentField,
          [language]: value
        }
      };
      saveGalleryContent(updatedContent);
    }
  };

  const handleGalleryImageChange = (field: string, value: string) => {
    const updatedContent = {
      ...galleryContent,
      [field]: value
    };
    saveGalleryContent(updatedContent);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gallery Hero Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hero Title (Indonesian)</Label>
              <Input
                value={galleryContent.heroTitle.id}
                onChange={(e) => handleGalleryContentChange('heroTitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hero Title (English)</Label>
              <Input
                value={galleryContent.heroTitle.en}
                onChange={(e) => handleGalleryContentChange('heroTitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hero Subtitle (Indonesian)</Label>
              <Textarea
                rows={3}
                value={galleryContent.heroSubtitle.id}
                onChange={(e) => handleGalleryContentChange('heroSubtitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hero Subtitle (English)</Label>
              <Textarea
                rows={3}
                value={galleryContent.heroSubtitle.en}
                onChange={(e) => handleGalleryContentChange('heroSubtitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <ImageUpload
            value={galleryContent.heroImage}
            onChange={(url) => handleGalleryImageChange('heroImage', url)}
            label="Hero Image"
            hint="Recommended: 1200×400px (3:1 landscape). Displays full width × 256px tall."
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gallery Items
            <Button onClick={() => setShowAddGalleryForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Gallery Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddGalleryForm && (
            <div className="border rounded-lg p-4 mb-4 bg-blue-50">
              <h4 className="font-medium mb-3">Add New Gallery Item</h4>
              <GalleryItemForm
                onSave={(item) => {
                  addGalleryItem(item);
                  setShowAddGalleryForm(false);
                }}
                onCancel={() => setShowAddGalleryForm(false)}
              />
            </div>
          )}
          <div className="grid gap-4">
            {galleryContent.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  {item.type === 'image' ? <ImageIcon className="h-6 w-6" /> : <span>🎥</span>}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.type} - {item.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGalleryItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteGalleryItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {editingGalleryItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h4 className="font-medium mb-3">Edit Gallery Item</h4>
                <GalleryItemForm
                  initialData={editingGalleryItem}
                  onSave={(item) => {
                    updateGalleryItem(editingGalleryItem.id, item);
                    setEditingGalleryItem(null);
                  }}
                  onCancel={() => setEditingGalleryItem(null)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryAdminTab;
