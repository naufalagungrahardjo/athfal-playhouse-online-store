
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebsiteCopy } from "@/hooks/useWebsiteCopy";
import { useToast } from "@/hooks/use-toast";

type CheckoutFormProps = {
  formData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    guardianStatus: string;
    paymentMethod: string;
    notes: string;
    childName: string;
    childAge: string;
    childBirthdate: string;
    childGender: string;
  };
  handleInputChange: (field: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  processing: boolean;
  activePaymentMethods: {
    id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    active: boolean;
  }[];
  formatCurrency: (amount: number) => string;
  total: number;
  autofillEnabled: boolean;
  onAutofillToggle: (enabled: boolean) => void;
  isLoggedIn: boolean;
};

const CheckoutForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  processing,
  activePaymentMethods,
  formatCurrency,
  total,
  autofillEnabled,
  onAutofillToggle,
  isLoggedIn
}: CheckoutFormProps) => {
  const { t, language } = useLanguage();
  const { copy } = useWebsiteCopy();
  const { toast } = useToast();
  const [consentChecked, setConsentChecked] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  const lang = language === 'id' ? 'id' : 'en';
  const termsTitle = copy.checkoutTerms?.title?.[lang] || copy.checkoutTerms?.title?.en || 'Terms & Conditions';
  const termsContent = copy.checkoutTerms?.content?.[lang] || copy.checkoutTerms?.content?.en || '';

  const handleConsentClick = () => {
    if (!consentChecked) {
      setShowTermsDialog(true);
    } else {
      setConsentChecked(false);
    }
  };

  const handleConfirmTerms = () => {
    setConsentChecked(true);
    setShowTermsDialog(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      toast({
        title: lang === 'id' ? 'Persetujuan Diperlukan' : 'Consent Required',
        description: lang === 'id'
          ? 'Silakan centang kotak persetujuan sebelum melanjutkan pesanan.'
          : 'Please check the consent box before proceeding with your order.',
        variant: 'destructive',
      });
      return;
    }
    handleSubmit(e);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {isLoggedIn && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="autofill" className="text-base">
                Use Profile Information
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically fill form with your saved profile data
              </p>
            </div>
            <Switch
              id="autofill"
              checked={autofillEnabled}
              onCheckedChange={onAutofillToggle}
            />
          </div>
        )}
        <div>
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            type="text"
            value={formData.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerEmail">Email Address *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerPhone">Phone Number *</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerAddress">Address</Label>
          <Textarea
            id="customerAddress"
            value={formData.customerAddress}
            onChange={(e) => handleInputChange('customerAddress', e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="guardianStatus">Status Wali</Label>
          <Input
            id="guardianStatus"
            type="text"
            value={formData.guardianStatus}
            onChange={(e) => handleInputChange('guardianStatus', e.target.value)}
            placeholder="Contoh: Orang tua, Wali, Kakek/Nenek, dll."
          />
        </div>
        <div>
          <Label htmlFor="childName">{t('childName')}</Label>
          <Input
            id="childName"
            type="text"
            value={formData.childName}
            onChange={(e) => handleInputChange('childName', e.target.value)}
            placeholder={t('childFieldNote')}
            className="placeholder:text-muted-foreground/50"
          />
        </div>
        <div>
          <Label>{lang === 'id' ? 'Jenis Kelamin Anak' : 'Child Gender'}</Label>
          <RadioGroup
            value={formData.childGender}
            onValueChange={(value) => handleInputChange('childGender', value)}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="boy" id="gender-boy" />
              <Label htmlFor="gender-boy" className="font-normal cursor-pointer">
                {lang === 'id' ? 'Laki-laki' : 'Boy'}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="girl" id="gender-girl" />
              <Label htmlFor="gender-girl" className="font-normal cursor-pointer">
                {lang === 'id' ? 'Perempuan' : 'Girl'}
              </Label>
            </div>
          </RadioGroup>
        </div>
        <div>
         <Label htmlFor="childBirthdate">{t('childBirthdate')}</Label>
          <Input
            id="childBirthdate"
            type="date"
            value={formData.childBirthdate}
            onChange={(e) => handleInputChange('childBirthdate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            placeholder={t('childFieldNote')}
            className="placeholder:text-muted-foreground/50"
          />
          <p className="text-xs text-muted-foreground/50 mt-1">{t('childFieldNote')}</p>
        </div>
        <div>
          <Label htmlFor="childAge">{t('childAge')}</Label>
          <Input
            id="childAge"
            type="text"
            value={formData.childAge}
            readOnly
            className="bg-muted cursor-not-allowed"
            placeholder={t('childAge')}
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          {activePaymentMethods.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                No payment methods available. Please contact administrator.
              </p>
            </div>
          ) : (
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {activePaymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.bank_name} className="max-w-full">
                    <div className="flex items-center gap-2 max-w-full overflow-hidden">
                      <span className="font-medium truncate">{method.bank_name}</span>
                      <span className="text-muted-foreground truncate">- {method.account_number}</span>
                      <span className="text-sm truncate">({method.account_name})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            placeholder="Any special instructions or notes..."
          />
        </div>

        {/* Consent Checkbox */}
        <div className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
          consentChecked 
            ? 'border-green-500 bg-green-50' 
            : 'border-amber-400 bg-amber-50 animate-pulse'
        }`}>
          <Checkbox
            id="consent"
            checked={consentChecked}
            onCheckedChange={(checked) => {
              if (checked) {
                setShowTermsDialog(true);
              } else {
                setConsentChecked(false);
              }
            }}
            className="mt-0.5 border-2 border-amber-500 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
          />
          <label
            htmlFor="consent"
            className={`text-sm leading-relaxed cursor-pointer select-none font-medium ${
              consentChecked ? 'text-green-700' : 'text-amber-800'
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (!consentChecked) {
                setShowTermsDialog(true);
              } else {
                setConsentChecked(false);
              }
            }}
          >
            {lang === 'id'
              ? '⚠️ Saya telah membaca dan menyetujui syarat & ketentuan yang berlaku'
              : '⚠️ I have read and agree to the applicable terms & conditions'}
          </label>
        </div>

        {!consentChecked && (
          <p className="text-sm text-amber-600 mt-4 text-center font-medium animate-pulse">
            ⚠️ {lang === 'id' 
              ? 'Silakan centang kotak persetujuan di atas untuk melanjutkan' 
              : 'Please check the consent box above to proceed'}
          </p>
        )}
        <Button 
          type="submit" 
          className="w-full mt-2 transition-all"
          disabled={processing || activePaymentMethods.length === 0 || !consentChecked}
        >
          {processing ? 'Processing...' : `Proceed Order - ${formatCurrency(total)}`}
        </Button>
      </form>

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{termsTitle}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="whitespace-pre-wrap text-sm leading-relaxed">
            {termsContent}
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTermsDialog(false)}>
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button onClick={handleConfirmTerms}>
              {lang === 'id' ? 'Saya Setuju' : 'I Agree'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckoutForm;
