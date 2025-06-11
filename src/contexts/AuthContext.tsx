
import { createContext, useContext, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { User } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPasswordForEmail,
  updateUserPassword,
  loadUserProfile
} from '@/utils/auth';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading, setUser, setSession } = useAuthState();
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await signInWithEmail(email, password);

      if (data.user) {
        const userData = await loadUserProfile(data.user);
        setUser(userData);
        toast({
          title: "Login berhasil",
          description: `Selamat datang`,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: error instanceof Error ? error.message : "Email atau password salah",
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const data = await signUpWithEmail(email, password, name);

      if (data.user) {
        toast({
          title: "Pendaftaran berhasil",
          description: "Silakan cek email Anda untuk konfirmasi",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        variant: "destructive",
        title: "Pendaftaran gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat akun",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      
      setUser(null);
      setSession(null);
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout gagal",
        description: "Terjadi kesalahan saat logout",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await resetPasswordForEmail(email);
      
      toast({
        title: "Reset password berhasil",
        description: "Cek email Anda untuk instruksi selanjutnya",
      });
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "Reset password gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat reset password",
      });
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      await updateUserPassword(newPassword);

      toast({
        title: "Password berhasil diperbarui",
        description: "Password Anda telah berhasil diubah",
      });
    } catch (error) {
      console.error('Update password error:', error);
      toast({
        variant: "destructive",
        title: "Gagal memperbarui password",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengubah password",
      });
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
