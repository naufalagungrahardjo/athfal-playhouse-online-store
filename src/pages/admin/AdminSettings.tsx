import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useDatabase, BilingualStep, DEFAULT_STEPS } from "@/hooks/useDatabase";
import { Save, Trash2, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/utils/logAdminAction";
import { ContactSettingsTab } from "@/components/admin/settings/ContactSettingsTab";
import { PaymentMethodsTab } from "@/components/admin/settings/PaymentMethodsTab";
import { TaxSettingsTab } from "@/components/admin/settings/TaxSettingsTab";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_COPY } from "@/hooks/useWebsiteCopy";

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

  const { user } = useAuth();

  const [localContact, setLocalContact] = useState(contact);
  const [localVat, setLocalVat] = useState(vat);
  const [localPayments, setLocalPayments] = useState(paymentMethods);
  const [newPayment, setNewPayment] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    active: true,
    payment_steps: [...DEFAULT_STEPS] as BilingualStep[],
  });

  // Payment confirmation copy state
  const [confirmationCopy, setConfirmationCopy] = useState(DEFAULT_COPY.paymentConfirmation);

  // Load confirmation copy from Supabase
  useEffect(() => {
    const loadCopy = async () => {
      const { data } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();
      if (data?.content && typeof data.content === 'object') {
        const stored = data.content as any;
        if (stored.paymentConfirmation) {
          setConfirmationCopy({
            ...DEFAULT_COPY.paymentConfirmation,
            ...stored.paymentConfirmation,
          });
        }
      }
    };
    loadCopy();
  }, []);

  const handleSaveConfirmationCopy = async () => {
    try {
      // Load current copy first
      const { data } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();

      const currentContent = (data?.content as any) || {};
      const updatedContent = {
        ...currentContent,
        paymentConfirmation: confirmationCopy,
      };

      const { error } = await supabase
        .from('website_copy')
        .update({ content: updatedContent as any, updated_at: new Date().toISOString() })
        .eq('id', 'main');

      if (error) throw error;

      window.dispatchEvent(new Event("websiteCopyUpdated"));
      toast({
        title: "Confirmation text updated",
        description: "Payment confirmation text saved successfully.",
      });
      logAdminAction({ user, action: "Updated payment confirmation text" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save confirmation text.",
      });
    }
  };

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
    logAdminAction({
      user,
      action: `Updated contact settings`
    });
  };

  const handleSaveVat = () => {
    saveVatSettings(localVat);
    toast({
      title: "Tax settings updated",
      description: "Your tax settings have been saved successfully.",
    });
    logAdminAction({
      user,
      action: `Updated VAT/tax settings`
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
      payment_steps: [...DEFAULT_STEPS],
    });
    logAdminAction({
      user,
      action: `Added new payment method (bank: ${newPayment.bank_name}, account: ${newPayment.account_number})`
    });
  };

  const handleUpdatePayment = async (id: string, field: string, value: string | boolean | string[] | BilingualStep[]) => {
    const payment = localPayments.find(p => p.id === id);
    if (payment) {
      await savePaymentMethod({
        ...payment,
        [field]: value
      });
      logAdminAction({
        user,
        action: `Updated payment method (id: ${id}, bank: ${payment.bank_name})`,
      });
    }
  };

  const handleAddPaymentStep = (paymentId: string) => {
    setLocalPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              payment_steps: [...(payment.payment_steps || []), { id: "", en: "" }] 
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
    logAdminAction({
      user,
      action: `Removed a payment step from payment method (id: ${paymentId})`
    });
  };

  const handleUpdatePaymentStep = (paymentId: string, stepIndex: number, lang: 'id' | 'en', value: string) => {
    setLocalPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              payment_steps: payment.payment_steps?.map((step, index) => 
                index === stepIndex ? { ...step, [lang]: value } : step
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
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto">
          <TabsTrigger value="contact" className="whitespace-normal">Contact Details</TabsTrigger>
          <TabsTrigger value="payment" className="whitespace-normal">Payment Methods</TabsTrigger>
          <TabsTrigger value="tax" className="whitespace-normal">Tax Settings</TabsTrigger>
        </TabsList>
        
        {/* Contact Details Tab */}
        <TabsContent value="contact" className="space-y-4">
          <ContactSettingsTab
            localContact={localContact}
            handleContactChange={handleContactChange}
            handleSaveContact={handleSaveContact}
          />
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <PaymentMethodsTab
            localPayments={localPayments}
            newPayment={newPayment}
            setNewPayment={setNewPayment}
            handleAddPayment={handleAddPayment}
            handleUpdatePayment={handleUpdatePayment}
            handleAddPaymentStep={handleAddPaymentStep}
            handleRemovePaymentStep={handleRemovePaymentStep}
            handleUpdatePaymentStep={handleUpdatePaymentStep}
            deletePaymentMethod={deletePaymentMethod}
            confirmationCopy={confirmationCopy}
            onConfirmationCopyChange={setConfirmationCopy}
            onSaveConfirmationCopy={handleSaveConfirmationCopy}
          />
        </TabsContent>
        
        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="space-y-4">
          <TaxSettingsTab
            localVat={localVat}
            setLocalVat={setLocalVat}
            handleSaveVat={handleSaveVat}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
