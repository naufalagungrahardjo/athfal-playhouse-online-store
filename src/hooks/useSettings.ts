import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContactSettings {
  email: string;
  whatsapp: string;
  address: string;
  instagram: string;
  youtube: string;
  whatsappGroup: string;
  googleMapsUrl?: string;
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

const DEFAULT_CONTACT: ContactSettings = {
  email: "athfalplayhouse@gmail.com",
  whatsapp: "082120614748",
  address: "Apartemen Park View Depok Town Square Lt. 1, Jl. Margonda Daya, Depok, 16424",
  instagram: "https://instagram.com/athfalplayhouse/",
  youtube: "https://www.youtube.com/@AthfalPlayhouse",
  whatsappGroup: "",
  googleMapsUrl: "https://g.co/kgs/jaPrJtj",
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

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch contact settings from Supabase
      const { data, error } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'contact_settings')
        .maybeSingle();

      if (!error && data?.content && typeof data.content === 'object') {
        const stored = data.content as Record<string, unknown>;
        if (stored.contact) {
          setContact({ ...DEFAULT_CONTACT, ...(stored.contact as Record<string, unknown>) } as ContactSettings);
        }
        if (stored.payments) {
          setPayments(stored.payments as unknown as PaymentMethod[]);
        }
        if (stored.vat) {
          setVat({ ...DEFAULT_VAT, ...(stored.vat as Record<string, unknown>) } as VATSettings);
        }
      } else {
        // Fallback: try localStorage for migration
        const savedContact = localStorage.getItem('athfal_contact_settings');
        const savedPayments = localStorage.getItem('athfal_payment_settings');
        const savedVat = localStorage.getItem('athfal_vat_settings');

        if (savedContact) setContact({ ...DEFAULT_CONTACT, ...JSON.parse(savedContact) });
        if (savedPayments) setPayments(JSON.parse(savedPayments));
        if (savedVat) setVat({ ...DEFAULT_VAT, ...JSON.parse(savedVat) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToSupabase = async (newContact: ContactSettings, newPayments: PaymentMethod[], newVat: VATSettings) => {
    const content = { contact: newContact, payments: newPayments, vat: newVat };
    const { error } = await supabase
      .from('website_copy')
      .upsert({ id: 'contact_settings', content: content as unknown as Record<string, unknown>, updated_at: new Date().toISOString() } as any);

    if (error) {
      console.error('Error saving settings to Supabase:', error);
    }
  };

  const saveContactSettings = async (newContact: ContactSettings) => {
    setContact(newContact);
    // Also keep localStorage as cache
    localStorage.setItem('athfal_contact_settings', JSON.stringify(newContact));
    await saveToSupabase(newContact, payments, vat);
  };

  const savePaymentSettings = async (newPayments: PaymentMethod[]) => {
    setPayments(newPayments);
    localStorage.setItem('athfal_payment_settings', JSON.stringify(newPayments));
    await saveToSupabase(contact, newPayments, vat);
  };

  const saveVatSettings = async (newVat: VATSettings) => {
    setVat(newVat);
    localStorage.setItem('athfal_vat_settings', JSON.stringify(newVat));
    await saveToSupabase(contact, payments, newVat);
  };

  useEffect(() => {
    fetchSettings();

    // Listen for real-time updates from Supabase
    const channel = supabase
      .channel('contact_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'website_copy',
        filter: 'id=eq.contact_settings'
      }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

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
