
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  homeSlogan: { id: string; en: string };
  onChange: (field: string, lang: "id" | "en", value: string) => void;
}

export default function SloganSectionEditor({ homeSlogan, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Slogan</CardTitle>
        <CardDescription>
          Slogan shown with logo at the top of homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Slogan (Indonesian)</Label>
            <Input
              value={homeSlogan.id}
              onChange={e => onChange('homeSlogan', 'id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Slogan (English)</Label>
            <Input
              value={homeSlogan.en}
              onChange={e => onChange('homeSlogan', 'en', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
