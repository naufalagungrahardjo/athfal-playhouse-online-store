
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface TaxSettingsTabProps {
  localVat: { enabled: boolean; percentage: number; };
  setLocalVat: (v: any) => void;
  handleSaveVat: () => void;
}

export const TaxSettingsTab = ({
  localVat,
  setLocalVat,
  handleSaveVat,
}: TaxSettingsTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Tax Settings</CardTitle>
      <CardDescription>
        Configure tax settings for your products.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enable-vat"
          checked={localVat.enabled}
          onChange={(e) => setLocalVat({...localVat, enabled: e.target.checked})}
          className="rounded border-gray-300"
        />
        <Label htmlFor="enable-vat" className="cursor-pointer">
          Enable VAT/Tax
        </Label>
      </div>
      
      {localVat.enabled && (
        <div className="space-y-2">
          <Label htmlFor="vat-percentage">Default VAT/Tax Percentage</Label>
          <div className="flex items-center">
            <Input
              id="vat-percentage"
              type="number"
              value={localVat.percentage}
              onChange={(e) => setLocalVat({...localVat, percentage: Number(e.target.value)})}
              className="w-24"
            />
            <span className="ml-2">%</span>
          </div>
          <p className="text-xs text-gray-500">
            This is the default tax rate. You can override it for specific products.
          </p>
        </div>
      )}
    </CardContent>
    <CardFooter>
      <Button onClick={handleSaveVat}>
        <Save className="mr-2 h-4 w-4" /> Save Tax Settings
      </Button>
    </CardFooter>
  </Card>
);
