import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, FileText } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import TeamMemberForm from "../team/TeamMemberForm";
import { TeamMember } from "@/hooks/useAboutContent";
import { useState } from "react";
import AboutSectionHeroImageUpload from "./AboutSectionHeroImageUpload";
import AboutSectionDecorativeImageUpload from "./AboutSectionDecorativeImageUpload";

interface AboutUsAdminTabProps {
  content: any;
  onContentChange: (section: string, language: 'id' | 'en', value: string) => void;
  onImageChange: (field: string, value: string) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  onUpdateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  onDeleteTeamMember: (id: string) => void;
}

const AboutUsAdminTab = ({
  content: aboutContent,
  onContentChange,
  onImageChange,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember
}: AboutUsAdminTabProps) => {

  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* --- About Us Hero Section --- */}
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
            {/* ... keep hero title inputs ... */}
            <div className="space-y-2">
              <Label>Hero Title (Indonesian)</Label>
              <Input
                value={aboutContent.heroTitle.id}
                onChange={(e) => onContentChange('heroTitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hero Title (English)</Label>
              <Input
                value={aboutContent.heroTitle.en}
                onChange={(e) => onContentChange('heroTitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <AboutSectionHeroImageUpload
            value={aboutContent.heroImage}
            onChange={(url) => onImageChange('heroImage', url)}
          />
          <AboutSectionDecorativeImageUpload
            value={aboutContent.aboutDecorativeImage || ""}
            onChange={(url) => onImageChange('aboutDecorativeImage', url)}
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
                onChange={(e) => onContentChange('missionTitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mission Title (English)</Label>
              <Input
                value={aboutContent.missionTitle.en}
                onChange={(e) => onContentChange('missionTitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mission Description (Indonesian)</Label>
              <Textarea
                rows={4}
                value={aboutContent.missionDescription.id}
                onChange={(e) => onContentChange('missionDescription', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mission Description (English)</Label>
              <Textarea
                rows={4}
                value={aboutContent.missionDescription.en}
                onChange={(e) => onContentChange('missionDescription', 'en', e.target.value)}
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
                onChange={(e) => onContentChange('visionTitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vision Title (English)</Label>
              <Input
                value={aboutContent.visionTitle.en}
                onChange={(e) => onContentChange('visionTitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vision Description (Indonesian)</Label>
              <Textarea
                rows={4}
                value={aboutContent.visionDescription.id}
                onChange={(e) => onContentChange('visionDescription', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vision Description (English)</Label>
              <Textarea
                rows={4}
                value={aboutContent.visionDescription.en}
                onChange={(e) => onContentChange('visionDescription', 'en', e.target.value)}
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
                onChange={(e) => onContentChange('valuesTitle', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Values Title (English)</Label>
              <Input
                value={aboutContent.valuesTitle.en}
                onChange={(e) => onContentChange('valuesTitle', 'en', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Values Description (Indonesian)</Label>
              <Textarea
                rows={4}
                value={aboutContent.valuesDescription.id}
                onChange={(e) => onContentChange('valuesDescription', 'id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Values Description (English)</Label>
              <Textarea
                rows={4}
                value={aboutContent.valuesDescription.en}
                onChange={(e) => onContentChange('valuesDescription', 'en', e.target.value)}
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
                  onAddTeamMember(member);
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
                    onClick={() => onDeleteTeamMember(member.id)}
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
                    onUpdateTeamMember(editingTeamMember.id, member);
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
