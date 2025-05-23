
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const location = useLocation();
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

  // Mock authentication functions (to be replaced with Supabase)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock login - this will be replaced with Supabase auth
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
        navigate('/admin');
      } else if (email && password) {
        // Mock regular user
        const regularUser = {
          id: '2',
          email,
          name: email.split('@')[0],
          role: 'user' as UserRole,
        };
        setUser(regularUser);
        localStorage.setItem('user', JSON.stringify(regularUser));
        toast({
          title: "Login berhasil",
          description: `Selamat datang, ${regularUser.name}`,
        });
        navigate('/profile');
      } else {
        throw new Error('Email or password incorrect');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: "Email atau password salah",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Mock signup - this will be replaced with Supabase auth
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
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
      navigate('/profile');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Pendaftaran gagal",
        description: "Terjadi kesalahan saat membuat akun",
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
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      // Mock password reset - this will be replaced with Supabase auth
      toast({
        title: "Reset password berhasil",
        description: "Cek email Anda untuk instruksi selanjutnya",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset password gagal",
        description: "Terjadi kesalahan saat reset password",
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
