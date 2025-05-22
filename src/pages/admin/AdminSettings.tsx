
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";

// Mock contact details
const MOCK_CONTACT = {
  email: "athfalplayhouse@gmail.com",
  whatsapp: "082120614748",
  address: "Apartemen Park View Depok Town Square Lt. 1, Jl. Margonda Daya, Depok, 16424",
  instagram: "https://instagram.com/athfalplayhouse/",
  youtube: "https://www.youtube.com/@AthfalPlayhouse",
  whatsappGroup: "",
};

// Mock payment options
const MOCK_PAYMENTS = [
  {
    id: "bca",
    bank: "BCA",
    accountNumber: "1234567890",
    accountName: "Athfal Playhouse",
    active: true,
  },
  {
    id: "jago",
    bank: "Bank Jago",
    accountNumber: "0987654321",
    accountName: "Fadhilah Ramadhannisa",
    active: true,
  },
  {
    id: "hijra",
    bank: "Bank Hijra",
    accountNumber: "7800110100142022",
    accountName: "Fadhilah Ramadhannisa",
    active: true,
  },
];

// Mock VAT settings
const MOCK_VAT = {
  enabled: true,
  percentage: 11,
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [contact, setContact] = useState(MOCK_CONTACT);
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [vat, setVat] = useState(MOCK_VAT);
  
  const handleContactChange = (field: keyof typeof contact, value: string) => {
    setContact(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePaymentChange = (id: string, field: string, value: string | boolean) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };
  
  const handleAddPayment = () => {
    const newPayment = {
      id: `payment-${payments.length + 1}`,
      bank: "",
      accountNumber: "",
      accountName: "",
      active: true,
    };
    
    setPayments([...payments, newPayment]);
  };
  
  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(payment => payment.id !== id));
  };
  
  const handleSaveSettings = (section: string) => {
    // In a real app, this would save to a database/API
    toast({
      title: `${section} settings updated`,
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="tax">Tax Settings</TabsTrigger>
        </TabsList>
        
        {/* Contact Details Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your contact information that will be displayed across the website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={contact.whatsapp}
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
                    value={contact.address}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    value={contact.instagram}
                    onChange={(e) => handleContactChange('instagram', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube Channel URL</Label>
                  <Input
                    id="youtube"
                    value={contact.youtube}
                    onChange={(e) => handleContactChange('youtube', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappGroup">WhatsApp Group Link (Optional)</Label>
                  <Input
                    id="whatsappGroup"
                    value={contact.whatsappGroup}
                    onChange={(e) => handleContactChange('whatsappGroup', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings('Contact')}>
                <Save className="mr-2 h-4 w-4" /> Save Contact Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage the payment methods available for customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div 
                    key={payment.id}
                    className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-end ${
                      index > 0 ? 'pt-4 border-t' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`bank-${payment.id}`}>Bank Name</Label>
                      <Input
                        id={`bank-${payment.id}`}
                        value={payment.bank}
                        onChange={(e) => handlePaymentChange(payment.id, 'bank', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`account-number-${payment.id}`}>Account Number</Label>
                      <Input
                        id={`account-number-${payment.id}`}
                        value={payment.accountNumber}
                        onChange={(e) => handlePaymentChange(payment.id, 'accountNumber', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`account-name-${payment.id}`}>Account Name</Label>
                      <Input
                        id={`account-name-${payment.id}`}
                        value={payment.accountName}
                        onChange={(e) => handlePaymentChange(payment.id, 'accountName', e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`active-${payment.id}`}
                        checked={payment.active}
                        onChange={(e) => handlePaymentChange(payment.id, 'active', e.target.checked)}
                        className="rounded border-gray-300 text-athfal-pink focus:ring-athfal-pink"
                      />
                      <Label htmlFor={`active-${payment.id}`} className="cursor-pointer">
                        Active
                      </Label>
                    </div>
                    
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleRemovePayment(payment.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleAddPayment}
                >
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveSettings('Payment')}>
                <Save className="mr-2 h-4 w-4" /> Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="space-y-4">
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
                  checked={vat.enabled}
                  onChange={(e) => setVat({...vat, enabled: e.target.checked})}
                  className="rounded border-gray-300 text-athfal-pink focus:ring-athfal-pink"
                />
                <Label htmlFor="enable-vat" className="cursor-pointer">
                  Enable VAT/Tax
                </Label>
              </div>
              
              {vat.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="vat-percentage">Default VAT/Tax Percentage</Label>
                  <div className="flex items-center">
                    <Input
                      id="vat-percentage"
                      type="number"
                      value={vat.percentage}
                      onChange={(e) => setVat({...vat, percentage: Number(e.target.value)})}
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
              <Button onClick={() => handleSaveSettings('Tax')}>
                <Save className="mr-2 h-4 w-4" /> Save Tax Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
