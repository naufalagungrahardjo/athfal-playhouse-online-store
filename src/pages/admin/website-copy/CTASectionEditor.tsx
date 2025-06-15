
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  ctaSectionTitle: { id: string; en: string };
  ctaSectionSubtitle: { id: string; en: string };
  onChange: (field: string, lang: "id" | "en", value: string) => void;
}

export default function CTASectionEditor({ ctaSectionTitle, ctaSectionSubtitle, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Call-to-Action Section</CardTitle>
        <CardDescription>
          CTA block at the bottom of homepage (e.g. "Join Now")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CTA Section Title (Indonesian)</Label>
            <Input
              value={ctaSectionTitle.id}
              onChange={e => onChange('ctaSectionTitle', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Section Title (English)</Label>
            <Input
              value={ctaSectionTitle.en}
              onChange={e => onChange('ctaSectionTitle', 'en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CTA Subtitle (Indonesian)</Label>
            <Textarea
              rows={3}
              value={ctaSectionSubtitle.id}
              onChange={e => onChange('ctaSectionSubtitle', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Subtitle (English)</Label>
            <Textarea
              rows={3}
              value={ctaSectionSubtitle.en}
              onChange={e => onChange('ctaSectionSubtitle', 'en', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
