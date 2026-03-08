
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot-password";

type AuthCardFooterProps = {
  authMode: AuthMode;
  language: string;
};

export const AuthCardFooter = ({ authMode, language }: AuthCardFooterProps) => {
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const message = language === 'id'
      ? 'Halo Athfal Playhouse, saya ingin meminta reset password untuk akun saya.'
      : 'Hello Athfal Playhouse, I would like to request a password reset for my account.';
    const url = `https://wa.me/6282120614748?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (authMode === 'login') {
    return (
      <>
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-athfal-pink hover:underline text-sm"
        >
          {language === 'id' ? 'Lupa password?' : 'Forgot password?'}
        </button>
        <div className="text-sm text-gray-600">
          {language === 'id' ? 'Belum memiliki akun? ' : "Don't have an account? "}
          <Link to="/auth/signup" className="text-athfal-pink hover:underline">
            {language === 'id' ? 'Daftar' : 'Sign up'}
          </Link>
        </div>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {language === 'id' ? 'Lupa Password?' : 'Forgot Password?'}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {language === 'id'
                  ? 'Silakan hubungi admin Athfal Playhouse melalui WhatsApp untuk mereset password akun Anda.'
                  : 'Please contact the Athfal Playhouse admin via WhatsApp to reset your account password.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {language === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setForgotOpen(false)}
                className="w-full"
              >
                {language === 'id' ? 'Tutup' : 'Close'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (authMode === 'signup') {
    return (
      <div className="text-sm text-gray-600">
        {language === 'id' ? 'Sudah memiliki akun? ' : 'Already have an account? '}
        <Link to="/auth/login" className="text-athfal-pink hover:underline">
          {language === 'id' ? 'Masuk' : 'Login'}
        </Link>
      </div>
    );
  }

  // forgot-password — redirect back to login
  return (
    <div className="text-sm text-gray-600">
      <Link to="/auth/login" className="text-athfal-pink hover:underline">
        {language === 'id' ? 'Kembali ke halaman masuk' : 'Back to login'}
      </Link>
    </div>
  );
};
