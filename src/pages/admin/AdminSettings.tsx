import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useDatabase } from "@/hooks/useDatabase";
import { Save, Trash2, Plus, X } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const { 
    contact, 
    vat, 
    loading: settingsLoading,
    saveContactSettings,
    saveVatSettings
  } = useSettings();
  
  const { 
    paymentMethods, 
    loading: dbLoading, 
    savePaymentMethod, 
    deletePaymentMethod 
  } = useDatabase();

  const [localContact, setLocalContact] = useState(contact);
  const [localVat, setLocalVat] = useState(vat);
  const [localPayments, setLocalPayments] = useState(paymentMethods);
  const [newPayment, setNewPayment] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    active: true,
    payment_steps: [
      "Open your m-banking or internet banking application.",
      "Select the bank transfer menu.",
      "Enter the account number.",
      "Enter the transfer amount.",
      "Confirm and complete your transfer.",
      "Save your payment receipt."
    ]
  });

  useEffect(() => {
    setLocalContact(contact);
    setLocalVat(vat);
  }, [contact, vat]);

  useEffect(() => {
    setLocalPayments(paymentMethods);
  }, [paymentMethods]);
  
  const handleContactChange = (field: keyof typeof localContact, value: string) => {
    setLocalContact(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveContact = () => {
    saveContactSettings(localContact);
    toast({
      title: "Contact settings updated",
      description: "Your contact information has been saved successfully.",
    });
  };

  const handleSaveVat = () => {
    saveVatSettings(localVat);
    toast({
      title: "Tax settings updated",
      description: "Your tax settings have been saved successfully.",
    });
  };

  const handleAddPayment = async () => {
    if (!newPayment.bank_name || !newPayment.account_number || !newPayment.account_name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all payment method fields.",
      });
      return;
    }

    await savePaymentMethod(newPayment);
    setNewPayment({
      bank_name: '',
      account_number: '',
      account_name: '',
      active: true,
      payment_steps: [
        "Open your m-banking or internet banking application.",
        "Select the bank transfer menu.",
        "Enter the account number.",
        "Enter the transfer amount.",
        "Confirm and complete your transfer.",
        "Save your payment receipt."
      ]
    });
  };

  const handleUpdatePayment = async (id: string, field: string, value: string | boolean | string[]) => {
    const payment = localPayments.find(p => p.id === id);
    if (payment) {
      await savePaymentMethod({
        ...payment,
        [field]: value
      });
    }
  };

  const handleAddPaymentStep = (paymentId: string) => {
    setLocalPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              payment_steps: [...(payment.payment_steps || []), ""] 
            }
          : payment
      )
    );
  };

  const handleRemovePaymentStep = (paymentId: string, stepIndex: number) => {
    setLocalPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              payment_steps: payment.payment_steps?.filter((_, index) => index !== stepIndex) || []
            }
          : payment
      )
    );
  };

  const handleUpdatePaymentStep = (paymentId: string, stepIndex: number, value: string) => {
    setLocalPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              payment_steps: payment.payment_steps?.map((step, index) => 
                index === stepIndex ? value : step
              ) || []
            }
          : payment
      )
    );
  };

  if (settingsLoading || dbLoading) {
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
                
                {/* New: Google Maps Location Embed URL */}
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps Location <span className="font-normal text-xs">(Embed Link Only)</span></Label>
                  <Input
                    id="googleMapsUrl"
                    value={localContact.googleMapsUrl || ""}
                    onChange={(e) => handleContactChange('googleMapsUrl', e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                  <p className="text-xs text-gray-500">
                    <strong>To show a map, paste the "Embed a map" URL from Google Maps (not a short link or place link).<br />
                    <span className="text-athfal-pink">How to get it?</span> Go to Google Maps &rarr; Search your place &rarr; Click "Share" &rarr; "Embed a map" &rarr; Copy only the <span className="font-mono">src=""</span> link.<br />
                    Example: <span className="font-mono">https://www.google.com/maps/embed?pb=...</span></strong>
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
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage the payment methods available for customers and customize payment instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add new payment method */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h3 className="font-medium mb-4">Add New Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input
                      placeholder="Bank Name"
                      value={newPayment.bank_name}
                      onChange={(e) => setNewPayment({...newPayment, bank_name: e.target.value})}
                    />
                    <Input
                      placeholder="Account Number"
                      value={newPayment.account_number}
                      onChange={(e) => setNewPayment({...newPayment, account_number: e.target.value})}
                    />
                    <Input
                      placeholder="Account Name"
                      value={newPayment.account_name}
                      onChange={(e) => setNewPayment({...newPayment, account_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Payment Steps</Label>
                    {newPayment.payment_steps.map((step, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const updatedSteps = [...newPayment.payment_steps];
                            updatedSteps[index] = e.target.value;
                            setNewPayment({...newPayment, payment_steps: updatedSteps});
                          }}
                          placeholder={`Step ${index + 1}`}
                        />
                        {newPayment.payment_steps.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedSteps = newPayment.payment_steps.filter((_, i) => i !== index);
                              setNewPayment({...newPayment, payment_steps: updatedSteps});
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPayment({
                        ...newPayment, 
                        payment_steps: [...newPayment.payment_steps, ""]
                      })}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  
                  <Button onClick={handleAddPayment}>
                    Add Payment Method
                  </Button>
                </div>

                {/* Existing payment methods */}
                <div className="space-y-6">
                  {localPayments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="border rounded-lg p-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label>Bank Name</Label>
                          <Input
                            value={payment.bank_name}
                            onChange={(e) => handleUpdatePayment(payment.id, 'bank_name', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>Account Number</Label>
                          <Input
                            value={payment.account_number}
                            onChange={(e) => handleUpdatePayment(payment.id, 'account_number', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>Account Name</Label>
                          <Input
                            value={payment.account_name}
                            onChange={(e) => handleUpdatePayment(payment.id, 'account_name', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 block">Payment Steps</Label>
                        {payment.payment_steps?.map((step, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              value={step}
                              onChange={(e) => handleUpdatePaymentStep(payment.id, index, e.target.value)}
                              placeholder={`Step ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemovePaymentStep(payment.id, index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPaymentStep(payment.id)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Step
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={payment.active}
                            onChange={(e) => handleUpdatePayment(payment.id, 'active', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label>Active</Label>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdatePayment(payment.id, 'payment_steps', payment.payment_steps || [])}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Steps
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deletePaymentMethod(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
