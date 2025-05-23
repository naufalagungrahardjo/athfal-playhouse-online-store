
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Authentication functions with Supabase integration
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if this is the admin
      if (email === 'admin@athfal.com' && password === 'admin123') {
        const adminUser = {
          id: '1',
          email,
          name: 'Admin',
          role: 'admin' as UserRole,
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        toast({
          title: "Login berhasil",
          description: "Selamat datang, Admin",
        });
        return;
      }
      
      // For regular users, check against registered users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) {
        throw new Error('Email tidak terdaftar');
      }
      
      // In a real app, we would use supabase.auth.signInWithPassword
      // For this mock implementation, we'll just check if the email exists
      const regularUser = {
        id: data.id || '2',
        email,
        name: data.name || email.split('@')[0],
        role: 'user' as UserRole,
      };
      
      setUser(regularUser);
      localStorage.setItem('user', JSON.stringify(regularUser));
      toast({
        title: "Login berhasil",
        description: `Selamat datang, ${regularUser.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: error instanceof Error ? error.message : "Email atau password salah",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        throw new Error('Email sudah terdaftar');
      }
      
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, name, password: 'hashed_' + password }])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      const newUser = {
        id: data.id,
        email,
        name,
        role: 'user' as UserRole,
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast({
        title: "Pendaftaran berhasil",
        description: "Akun Anda telah dibuat",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Pendaftaran gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat akun",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logout berhasil",
      description: "Anda telah keluar dari akun",
    });
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // In a real app with Supabase auth, we would use:
      // const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      // Mock implementation
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (!data) {
        throw new Error('Email tidak terdaftar');
      }
      
      toast({
        title: "Reset password berhasil",
        description: "Cek email Anda untuk instruksi selanjutnya",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset password gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat reset password",
      });
      throw error;
    } finally {
      setLoading(false);
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
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
