import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, FileText } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import TeamMemberForm from "../team/TeamMemberForm";
import { useAboutContent, TeamMember } from "@/hooks/useAboutContent";
import { useState } from "react";

const AboutUsAdminTab = () => {
  const {
    content: aboutContent,
    saveContent: saveAboutContent,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
  } = useAboutContent();

  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);

  // Handle section-level changes for about content (for both "id" and "en" fields)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            About Us Hero Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Hero Title/Subtitle fields --- */}
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
          {/* --- Hero Image Upload --- */}
          <ImageUpload
            value={aboutContent.heroImage}
            onChange={(url) => handleAboutImageChange('heroImage', url)}
            label="Hero Image (Main Large Image)"
          />
          {/* --- Decorative Image Upload --- */}
          <ImageUpload
            value={aboutContent.aboutDecorativeImage || ""}
            onChange={(url) => handleAboutImageChange('aboutDecorativeImage', url)}
            label="Decorative Image (Yellow Circle - Small Image)"
            className="mt-6"
          />
        </CardContent>
      </Card>
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
    </div>
  );
};

export default AboutUsAdminTab;
