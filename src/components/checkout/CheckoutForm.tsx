
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

type CheckoutFormProps = {
  formData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: string;
    notes: string;
    childName: string;
    childAge: string;
    childBirthdate: string;
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
  const { t } = useLanguage();
  return (
  <form onSubmit={handleSubmit} className="space-y-4">
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
      <Label htmlFor="childAge">{t('childAge')}</Label>
      <Input
        id="childAge"
        type="text"
        value={formData.childAge}
        onChange={(e) => handleInputChange('childAge', e.target.value)}
        placeholder={t('childFieldNote')}
        className="placeholder:text-muted-foreground/50"
      />
    </div>
    <div>
      <Label htmlFor="childBirthdate">{t('childBirthdate')}</Label>
      <Input
        id="childBirthdate"
        type="date"
        value={formData.childBirthdate}
        onChange={(e) => handleInputChange('childBirthdate', e.target.value)}
        placeholder={t('childFieldNote')}
        className="placeholder:text-muted-foreground/50"
      />
      <p className="text-xs text-muted-foreground/50 mt-1">{t('childFieldNote')}</p>
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
              <SelectItem key={method.id} value={method.id} className="max-w-full">
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
    <Button 
      type="submit" 
      className="w-full mt-6"
      disabled={processing || activePaymentMethods.length === 0}
    >
      {processing ? 'Processing...' : `Proceed Order - ${formatCurrency(total)}`}
    </Button>
  </form>
  );
};

export default CheckoutForm;
