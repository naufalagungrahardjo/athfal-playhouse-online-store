
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AuthTitleSection } from "@/components/auth/AuthTitleSection";
import { AuthCardFooter } from "@/components/auth/AuthCardFooter";

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

  // When user is logged in, determine redirection by role
  useEffect(() => {
    if (user) {
      if (
        user.role === 'admin' ||
        user.role === 'super_admin' ||
        user.role === 'orders_manager' ||
        user.role === 'order_staff' ||
        user.role === 'content_manager' ||
        user.role === 'content_staff'
      ) {
        navigate('/admin', { replace: true });
      } else {
        // Default user: go to orders tab on profile page
        navigate('/profile?tab=orders', { replace: true });
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <AuthTitleSection authMode={authMode} language={language} />
        <Card>
          <CardContent>
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
            <AuthCardFooter authMode={authMode} language={language} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
