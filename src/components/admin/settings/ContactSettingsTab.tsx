
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

interface ContactSettingsTabProps {
  localContact: any;
  handleContactChange: (field: string, value: string) => void;
  handleSaveContact: () => void;
}

export const ContactSettingsTab = ({
  localContact,
  handleContactChange,
  handleSaveContact,
}: ContactSettingsTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Contact Information</CardTitle>
      <CardDescription>
        Update your contact information that will be displayed across the website.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* ... Email, WhatsApp, Address, Instagram, YouTube, WhatsApp Group, Google Maps fields ... */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={localContact.email}
            onChange={(e) => handleContactChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp Number</Label>
          <Input
            id="whatsapp"
            value={localContact.whatsapp}
            onChange={(e) => handleContactChange('whatsapp', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Format: 62812XXXXXXXX (Indonesian format)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={localContact.address}
            onChange={(e) => handleContactChange('address', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            value={localContact.instagram}
            onChange={(e) => handleContactChange('instagram', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="youtube">YouTube Channel URL</Label>
          <Input
            id="youtube"
            value={localContact.youtube}
            onChange={(e) => handleContactChange('youtube', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsappGroup">WhatsApp Group Link (Optional)</Label>
          <Input
            id="whatsappGroup"
            value={localContact.whatsappGroup}
            onChange={(e) => handleContactChange('whatsappGroup', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="googleMapsUrl">Google Maps Location <span className="font-normal text-xs">(Embed Link Only)</span></Label>
          <Input
            id="googleMapsUrl"
            value={localContact.googleMapsUrl || ""}
            onChange={(e) => handleContactChange('googleMapsUrl', e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          <p className="text-xs text-gray-500">
            <strong>
              To show a map, paste the "Embed a map" URL from Google Maps (not a short link or place link).<br />
              <span className="text-athfal-pink">How to get it?</span> Go to Google Maps &rarr; Search your place &rarr; Click "Share" &rarr; "Embed a map" &rarr; Copy only the <span className="font-mono">src=""</span> link.<br />
              Example: <span className="font-mono">https://www.google.com/maps/embed?pb=...</span>
            </strong>
          </p>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button onClick={handleSaveContact}>
        <Save className="mr-2 h-4 w-4" /> Save Contact Details
      </Button>
    </CardFooter>
  </Card>
);
