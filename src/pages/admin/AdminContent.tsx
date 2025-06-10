
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, FileText, Image, Info, Plus, Trash2, Edit } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { useAboutContent, TeamMember } from "@/hooks/useAboutContent";
import { useGalleryContent, GalleryItem } from "@/hooks/useGalleryContent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminContent = () => {
  const { content: aboutContent, saveContent: saveAboutContent, addTeamMember, updateTeamMember, deleteTeamMember } = useAboutContent();
  const { content: galleryContent, saveContent: saveGalleryContent, addGalleryItem, updateGalleryItem, deleteGalleryItem } = useGalleryContent();
  
  const [activeTab, setActiveTab] = useState("about");
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [showAddGalleryForm, setShowAddGalleryForm] = useState(false);

  const handleAboutContentChange = (section: keyof typeof aboutContent, language: 'id' | 'en', value: string) => {
    const currentSection = aboutContent[section];
    if (typeof currentSection === 'object' && currentSection !== null && 'id' in currentSection && 'en' in currentSection) {
      const updatedContent = {
        ...aboutContent,
        [section]: {
          ...currentSection,
          [language]: value
        }
      };
      saveAboutContent(updatedContent);
    }
  };

  const handleAboutImageChange = (field: string, value: string) => {
    const updatedContent = {
      ...aboutContent,
      [field]: value
    };
    saveAboutContent(updatedContent);
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-athfal-pink" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
            <p className="text-gray-600">Manage About Us and Gallery page content</p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="about">About Us Page</TabsTrigger>
          <TabsTrigger value="gallery">Gallery Page</TabsTrigger>
        </TabsList>
        
        {/* About Us Content */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Hero Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.heroTitle.id}
                    onChange={(e) => handleAboutContentChange('heroTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={aboutContent.heroTitle.en}
                    onChange={(e) => handleAboutContentChange('heroTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hero Subtitle (Indonesian)</Label>
                  <Textarea
                    rows={3}
                    value={aboutContent.heroSubtitle.id}
                    onChange={(e) => handleAboutContentChange('heroSubtitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle (English)</Label>
                  <Textarea
                    rows={3}
                    value={aboutContent.heroSubtitle.en}
                    onChange={(e) => handleAboutContentChange('heroSubtitle', 'en', e.target.value)}
                  />
                </div>
              </div>

              <ImageUpload
                value={aboutContent.heroImage}
                onChange={(url) => handleAboutImageChange('heroImage', url)}
                label="Hero Image"
              />
            </CardContent>
          </Card>

          {/* Mission, Vision, Values sections */}
          <Card>
            <CardHeader>
              <CardTitle>Mission Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.missionTitle.id}
                    onChange={(e) => handleAboutContentChange('missionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Title (English)</Label>
                  <Input
                    value={aboutContent.missionTitle.en}
                    onChange={(e) => handleAboutContentChange('missionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.missionDescription.id}
                    onChange={(e) => handleAboutContentChange('missionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mission Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.missionDescription.en}
                    onChange={(e) => handleAboutContentChange('missionDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vision Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vision Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.visionTitle.id}
                    onChange={(e) => handleAboutContentChange('visionTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Title (English)</Label>
                  <Input
                    value={aboutContent.visionTitle.en}
                    onChange={(e) => handleAboutContentChange('visionTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vision Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.visionDescription.id}
                    onChange={(e) => handleAboutContentChange('visionDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vision Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.visionDescription.en}
                    onChange={(e) => handleAboutContentChange('visionDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Values Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Values Title (Indonesian)</Label>
                  <Input
                    value={aboutContent.valuesTitle.id}
                    onChange={(e) => handleAboutContentChange('valuesTitle', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Values Title (English)</Label>
                  <Input
                    value={aboutContent.valuesTitle.en}
                    onChange={(e) => handleAboutContentChange('valuesTitle', 'en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Values Description (Indonesian)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.valuesDescription.id}
                    onChange={(e) => handleAboutContentChange('valuesDescription', 'id', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Values Description (English)</Label>
                  <Textarea
                    rows={4}
                    value={aboutContent.valuesDescription.en}
                    onChange={(e) => handleAboutContentChange('valuesDescription', 'en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Management
                <Button onClick={() => setShowAddTeamForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddTeamForm && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Add New Team Member</h4>
                  <TeamMemberForm
                    onSave={(member) => {
                      addTeamMember(member);
                      setShowAddTeamForm(false);
                    }}
                    onCancel={() => setShowAddTeamForm(false)}
                  />
                </div>
              )}
              
              <div className="grid gap-4">
                {aboutContent.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img src={member.image} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                    <div className="flex-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-sm text-gray-500">{member.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTeamMember(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTeamMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {editingTeamMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h4 className="font-medium mb-3">Edit Team Member</h4>
                    <TeamMemberForm
                      initialData={editingTeamMember}
                      onSave={(member) => {
                        updateTeamMember(editingTeamMember.id, member);
                        setEditingTeamMember(null);
                      }}
                      onCancel={() => setEditingTeamMember(null)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Gallery Content */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
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
              />
            </CardContent>
          </Card>

          {/* Gallery Items Management */}
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
                      {item.type === 'image' ? <Image className="h-6 w-6" /> : <span>🎥</span>}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Team Member Form Component
const TeamMemberForm = ({ initialData, onSave, onCancel }: {
  initialData?: TeamMember;
  onSave: (member: Omit<TeamMember, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [member, setMember] = useState({
    name: initialData?.name || '',
    title: initialData?.title || '',
    image: initialData?.image || '',
    linkedin: initialData?.linkedin || ''
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={member.name}
          onChange={(e) => setMember({...member, name: e.target.value})}
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={member.title}
          onChange={(e) => setMember({...member, title: e.target.value})}
        />
      </div>
      <div>
        <Label>LinkedIn URL</Label>
        <Input
          value={member.linkedin}
          onChange={(e) => setMember({...member, linkedin: e.target.value})}
        />
      </div>
      <ImageUpload
        value={member.image}
        onChange={(url) => setMember({...member, image: url})}
        label="Profile Image"
      />
      <div className="flex gap-2">
        <Button onClick={() => onSave(member)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

// Gallery Item Form Component
const GalleryItemForm = ({ initialData, onSave, onCancel }: {
  initialData?: GalleryItem;
  onSave: (item: Omit<GalleryItem, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [item, setItem] = useState({
    type: initialData?.type || 'image' as 'image' | 'video',
    url: initialData?.url || '',
    title: initialData?.title || '',
    description: initialData?.description || ''
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={item.type} onValueChange={(value: 'image' | 'video') => setItem({...item, type: value})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={item.title}
          onChange={(e) => setItem({...item, title: e.target.value})}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={item.description}
          onChange={(e) => setItem({...item, description: e.target.value})}
        />
      </div>
      <div>
        <Label>{item.type === 'video' ? 'Video URL (YouTube embed)' : 'Image URL'}</Label>
        <Input
          value={item.url}
          onChange={(e) => setItem({...item, url: e.target.value})}
          placeholder={item.type === 'video' ? 'https://www.youtube.com/embed/...' : 'https://example.com/image.jpg'}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(item)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default AdminContent;
