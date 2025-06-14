
import { Link } from "react-router-dom";

type AuthMode = "login" | "signup" | "forgot-password";

type AuthCardFooterProps = {
  authMode: AuthMode;
  language: string;
};

export const AuthCardFooter = ({ authMode, language }: AuthCardFooterProps) => {
  if (authMode === 'login') {
    return (
      <>
        <Link
          to="/auth/forgot-password"
          className="text-athfal-pink hover:underline text-sm"
        >
          {language === 'id' ? 'Lupa password?' : 'Forgot password?'}
        </Link>
        <div className="text-sm text-gray-600">
          {language === 'id' ? 'Belum memiliki akun? ' : "Don't have an account? "}
          <Link to="/auth/signup" className="text-athfal-pink hover:underline">
            {language === 'id' ? 'Daftar' : 'Sign up'}
          </Link>
        </div>
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

  // forgot-password
  return (
    <div className="text-sm text-gray-600">
      <Link to="/auth/login" className="text-athfal-pink hover:underline">
        {language === 'id' ? 'Kembali ke halaman masuk' : 'Back to login'}
      </Link>
    </div>
  );
};
