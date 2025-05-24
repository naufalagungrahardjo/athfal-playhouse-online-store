
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { Save } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const { 
    contact, 
    payments, 
    vat, 
    loading,
    saveContactSettings,
    savePaymentSettings,
    saveVatSettings
  } = useSettings();

  const [localContact, setLocalContact] = useState(contact);
  const [localPayments, setLocalPayments] = useState(payments);
  const [localVat, setLocalVat] = useState(vat);

  useEffect(() => {
    setLocalContact(contact);
    setLocalPayments(payments);
    setLocalVat(vat);
  }, [contact, payments, vat]);
  
  const handleContactChange = (field: keyof typeof localContact, value: string) => {
    setLocalContact(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePaymentChange = (id: string, field: string, value: string | boolean) => {
    setLocalPayments(prev => 
      prev.map(payment => 
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };
  
  const handleAddPayment = () => {
    const newPayment = {
      id: `payment-${localPayments.length + 1}`,
      bank: "",
      accountNumber: "",
      accountName: "",
      active: true,
    };
    
    setLocalPayments([...localPayments, newPayment]);
  };
  
  const handleRemovePayment = (id: string) => {
    setLocalPayments(prev => prev.filter(payment => payment.id !== id));
  };
  
  const handleSaveContact = () => {
    saveContactSettings(localContact);
    toast({
      title: "Contact settings updated",
      description: "Your contact information has been saved successfully.",
    });
  };

  const handleSavePayments = () => {
    savePaymentSettings(localPayments);
    toast({
      title: "Payment settings updated",
      description: "Your payment methods have been saved successfully.",
    });
  };

  const handleSaveVat = () => {
    saveVatSettings(localVat);
    toast({
      title: "Tax settings updated",
      description: "Your tax settings have been saved successfully.",
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

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
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveContact}>
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
                {localPayments.map((payment, index) => (
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
              <Button onClick={handleSavePayments}>
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
                  checked={localVat.enabled}
                  onChange={(e) => setLocalVat({...localVat, enabled: e.target.checked})}
                  className="rounded border-gray-300 text-athfal-pink focus:ring-athfal-pink"
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
