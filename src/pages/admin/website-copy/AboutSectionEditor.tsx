
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";

interface Props {
  aboutTitle: { id: string; en: string };
  aboutDescription: { id: string; en: string };
  aboutExtraParagraph: { id: string; en: string };
  aboutDecorativeImage?: string;
  onChange: (field: string, lang: "id" | "en", value: string) => void;
  onDecorativeImageChange?: (url: string) => void;
}

export default function AboutSectionEditor({
  aboutTitle,
  aboutDescription,
  aboutExtraParagraph,
  aboutDecorativeImage,
  onChange,
  onDecorativeImageChange
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Section</CardTitle>
        <CardDescription>
          About us content on the homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>About Title (Indonesian)</Label>
            <Input
              value={aboutTitle.id}
              onChange={e => onChange('aboutTitle', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>About Title (English)</Label>
            <Input
              value={aboutTitle.en}
              onChange={e => onChange('aboutTitle', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>About Description (Indonesian)</Label>
            <Textarea
              rows={4}
              value={aboutDescription.id}
              onChange={e => onChange('aboutDescription', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>About Description (English)</Label>
            <Textarea
              rows={4}
              value={aboutDescription.en}
              onChange={e => onChange('aboutDescription', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Extra Paragraph (Indonesian)</Label>
            <Textarea
              rows={4}
              value={aboutExtraParagraph.id}
              onChange={e => onChange('aboutExtraParagraph', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Extra Paragraph (English)</Label>
            <Textarea
              rows={4}
              value={aboutExtraParagraph.en}
              onChange={e => onChange('aboutExtraParagraph', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Decorative Image (Yellow Circle - Small Image)</Label>
          <ImageUpload
            value={aboutDecorativeImage}
            onChange={url => onDecorativeImageChange && onDecorativeImageChange(url)}
            label="Decorative Image"
          />
        </div>
      </CardContent>
    </Card>
  );
}
