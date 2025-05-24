
import { useState, useEffect } from 'react';

export interface ContactSettings {
  email: string;
  whatsapp: string;
  address: string;
  instagram: string;
  youtube: string;
  whatsappGroup: string;
}

export interface PaymentMethod {
  id: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  active: boolean;
}

export interface VATSettings {
  enabled: boolean;
  percentage: number;
}

// Default settings that can be overridden by admin
const DEFAULT_CONTACT: ContactSettings = {
  email: "athfalplayhouse@gmail.com",
  whatsapp: "082120614748",
  address: "Apartemen Park View Depok Town Square Lt. 1, Jl. Margonda Daya, Depok, 16424",
  instagram: "https://instagram.com/athfalplayhouse/",
  youtube: "https://www.youtube.com/@AthfalPlayhouse",
  whatsappGroup: "",
};

const DEFAULT_PAYMENTS: PaymentMethod[] = [
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

const DEFAULT_VAT: VATSettings = {
  enabled: true,
  percentage: 11,
};

export const useSettings = () => {
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [payments, setPayments] = useState<PaymentMethod[]>(DEFAULT_PAYMENTS);
  const [vat, setVat] = useState<VATSettings>(DEFAULT_VAT);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage if available, otherwise use defaults
      const savedContact = localStorage.getItem('athfal_contact_settings');
      const savedPayments = localStorage.getItem('athfal_payment_settings');
      const savedVat = localStorage.getItem('athfal_vat_settings');

      if (savedContact) {
        setContact(JSON.parse(savedContact));
      }
      if (savedPayments) {
        setPayments(JSON.parse(savedPayments));
      }
      if (savedVat) {
        setVat(JSON.parse(savedVat));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContactSettings = (newContact: ContactSettings) => {
    setContact(newContact);
    localStorage.setItem('athfal_contact_settings', JSON.stringify(newContact));
  };

  const savePaymentSettings = (newPayments: PaymentMethod[]) => {
    setPayments(newPayments);
    localStorage.setItem('athfal_payment_settings', JSON.stringify(newPayments));
  };

  const saveVatSettings = (newVat: VATSettings) => {
    setVat(newVat);
    localStorage.setItem('athfal_vat_settings', JSON.stringify(newVat));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    contact,
    payments,
    vat,
    loading,
    saveContactSettings,
    savePaymentSettings,
    saveVatSettings,
    fetchSettings
  };
};
