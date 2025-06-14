import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

type AuthMode = 'login' | 'signup' | 'forgot-password';

const AuthPage = () => {
  const { mode } = useParams<{ mode?: string }>();
  const authMode: AuthMode = (mode as AuthMode) || 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, resetPassword, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      switch (authMode) {
        case 'login':
          await login(email, password);
          break;
        case 'signup':
          if (password !== confirmPassword) {
            throw new Error(language === 'id' ? 'Password tidak cocok' : 'Passwords do not match');
          }
          await signup(email, password, name);
          break;
        case 'forgot-password':
          await resetPassword(email);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = (): string => {
    switch (authMode) {
      case 'login':
        return language === 'id' ? 'Masuk' : 'Login';
      case 'signup':
        return language === 'id' ? 'Daftar' : 'Sign Up';
      case 'forgot-password':
        return language === 'id' ? 'Lupa Password' : 'Forgot Password';
      default:
        return '';
    }
  };

  const getDescription = (): string => {
    switch (authMode) {
      case 'login':
        return language === 'id' 
          ? 'Masukkan email dan password Anda untuk masuk ke akun Anda.'
          : 'Enter your email and password to access your account.';
      case 'signup':
        return language === 'id'
          ? 'Isi form berikut untuk mendaftar akun baru.'
          : 'Fill out the form below to create a new account.';
      case 'forgot-password':
        return language === 'id'
          ? 'Masukkan email Anda untuk reset password.'
          : 'Enter your email to reset your password.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/">
            <img
              src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png"
              alt="Athfal Playhouse Logo"
              className="h-12 mx-auto"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-athfal-pink">{getTitle()}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Refactored to use form components */}
            {authMode === "login" && (
              <LoginForm
                email={email}
                password={password}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                language={language}
                setShowPassword={setShowPassword}
                showPassword={showPassword}
              />
            )}
            {authMode === "signup" && (
              <SignupForm
                name={name}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                language={language}
                setShowPassword={setShowPassword}
                showPassword={showPassword}
              />
            )}
            {authMode === "forgot-password" && (
              <ForgotPasswordForm
                email={email}
                onEmailChange={setEmail}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                language={language}
              />
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t p-4">
            {authMode === 'login' && (
              <>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-athfal-pink hover:underline text-sm"
                >
                  {language === 'id' ? 'Lupa password?' : 'Forgot password?'}
                </Link>
                <div className="text-sm text-gray-600">
                  {language === 'id' ? 'Belum memiliki akun? ' : 'Don\'t have an account? '}
                  <Link to="/auth/signup" className="text-athfal-pink hover:underline">
                    {language === 'id' ? 'Daftar' : 'Sign up'}
                  </Link>
                </div>
              </>
            )}

            {authMode === 'signup' && (
              <div className="text-sm text-gray-600">
                {language === 'id' ? 'Sudah memiliki akun? ' : 'Already have an account? '}
                <Link to="/auth/login" className="text-athfal-pink hover:underline">
                  {language === 'id' ? 'Masuk' : 'Login'}
                </Link>
              </div>
            )}

            {authMode === 'forgot-password' && (
              <div className="text-sm text-gray-600">
                <Link to="/auth/login" className="text-athfal-pink hover:underline">
                  {language === 'id' ? 'Kembali ke halaman masuk' : 'Back to login'}
                </Link>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
