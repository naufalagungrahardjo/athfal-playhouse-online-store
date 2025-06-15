
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialAddress: string;
}

const ProfileDetailsForm = ({
  initialName,
  initialEmail,
  initialPhone,
  initialAddress,
}: Props) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: language === 'id' ? 'Profil diperbarui' : 'Profile updated',
        description: language === 'id'
          ? 'Informasi profil Anda telah diperbarui'
          : 'Your profile information has been updated',
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleUpdateProfile(); }}>
      <div className="space-y-2">
        <Label htmlFor="name">{language === 'id' ? 'Nama Lengkap' : 'Full Name'}</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{language === 'id' ? 'Nomor Telepon' : 'Phone Number'}</Label>
        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">{language === 'id' ? 'Alamat' : 'Address'}</Label>
        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <Button 
        className="bg-athfal-pink hover:bg-athfal-pink/80 text-white"
        type="submit"
        disabled={isLoading}
      >
        {language === 'id' ? 'Perbarui Profil' : 'Update Profile'}
      </Button>
    </form>
  );
};

export default ProfileDetailsForm;
