
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface Props {
  heroTitle: { id: string; en: string };
  heroSubtitle: { id: string; en: string };
  ctaButton: { id: string; en: string };
  onChange: (field: string, lang: "id" | "en", value: string) => void;
}

export default function HeroSectionEditor({ heroTitle, heroSubtitle, ctaButton, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Hero Section
        </CardTitle>
        <CardDescription>
          Main banner text and call-to-action on the homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hero Title (Indonesian)</Label>
            <Input
              value={heroTitle.id}
              onChange={e => onChange('heroTitle', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Hero Title (English)</Label>
            <Input
              value={heroTitle.en}
              onChange={e => onChange('heroTitle', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hero Subtitle (Indonesian)</Label>
            <Textarea
              rows={3}
              value={heroSubtitle.id}
              onChange={e => onChange('heroSubtitle', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Hero Subtitle (English)</Label>
            <Textarea
              rows={3}
              value={heroSubtitle.en}
              onChange={e => onChange('heroSubtitle', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Call-to-Action Button (Indonesian)</Label>
            <Input
              value={ctaButton.id}
              onChange={e => onChange('ctaButton', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Call-to-Action Button (English)</Label>
            <Input
              value={ctaButton.en}
              onChange={e => onChange('ctaButton', 'en', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
