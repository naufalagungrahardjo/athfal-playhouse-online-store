
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from "@/hooks/use-toast";

const PasswordChangeForm = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'id' ? 'Password tidak cocok' : 'Passwords do not match',
        description: language === 'id'
          ? 'Pastikan password baru dan konfirmasi password sama'
          : 'Make sure new password and confirm password are the same',
        variant: 'destructive',
      });
      return;
    }
    if (!currentPassword || !newPassword) {
      toast({
        title: language === 'id' ? 'Field kosong' : 'Empty fields',
        description: language === 'id'
          ? 'Semua field harus diisi'
          : 'All fields must be filled in',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: language === 'id' ? 'Password diperbarui' : 'Password updated',
        description: language === 'id'
          ? 'Password Anda telah diperbarui'
          : 'Your password has been updated',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    }, 500);
  };

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleChangePassword(); }}>
      <div className="space-y-2">
        <Label htmlFor="current-password">{language === 'id' ? 'Password Lama' : 'Current Password'}</Label>
        <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">{language === 'id' ? 'Password Baru' : 'New Password'}</Label>
        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">{language === 'id' ? 'Konfirmasi Password' : 'Confirm Password'}</Label>
        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </div>
      <Button variant="outline" type="submit" disabled={isLoading}>
        {language === 'id' ? 'Perbarui Password' : 'Update Password'}
      </Button>
    </form>
  );
};

export default PasswordChangeForm;
