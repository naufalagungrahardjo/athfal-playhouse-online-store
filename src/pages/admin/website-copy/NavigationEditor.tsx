
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  navigation: Record<string, { id: string; en: string }>;
  onChange: (key: string, lang: "id" | "en", value: string) => void;
}

export default function NavigationEditor({ navigation, onChange }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Navigation Menu</CardTitle>
        <CardDescription>
          Text for main navigation menu items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(navigation).map(([key, value]) => (
          <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="capitalize">{key} (Indonesian)</Label>
              <Input
                value={value.id}
                onChange={e => onChange(key, "id", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="capitalize">{key} (English)</Label>
              <Input
                value={value.en}
                onChange={e => onChange(key, "en", e.target.value)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
