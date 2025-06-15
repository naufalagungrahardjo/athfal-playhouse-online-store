
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ImageUpload";
import type { TeamMember } from "@/hooks/useAboutContent";

interface Props {
  initialData?: TeamMember;
  onSave: (member: Omit<TeamMember, "id">) => void;
  onCancel: () => void;
}

export default function TeamMemberForm({ initialData, onSave, onCancel }: Props) {
  const [member, setMember] = useState({
    name: initialData?.name || '',
    title: initialData?.title || '',
    image: initialData?.image || '',
    linkedin: initialData?.linkedin || '',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={member.name}
          onChange={e => setMember({ ...member, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={member.title}
          onChange={e => setMember({ ...member, title: e.target.value })}
        />
      </div>
      <div>
        <Label>LinkedIn URL</Label>
        <Input
          value={member.linkedin}
          onChange={e => setMember({ ...member, linkedin: e.target.value })}
        />
      </div>
      <ImageUpload
        value={member.image}
        onChange={url => setMember({ ...member, image: url })}
        label="Profile Image"
      />
      <div className="flex gap-2">
        <Button onClick={() => onSave(member)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
