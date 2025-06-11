
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '@/types/auth';

export const loadUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
  try {
    // Check if user is admin by checking admin_users table
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', supabaseUser.id)
      .single();

    const userRole: UserRole = adminData ? 'admin' : 'user';
    
    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      role: userRole
    };

    return userData;
  } catch (error) {
    console.error('Error loading user profile:', error);
    // Return basic user data even if profile loading fails
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      role: 'user'
    };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('Attempting login for:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  console.log('Attempting signup for:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      },
      emailRedirectTo: `${window.location.origin}/`
    }
  });

  if (error) {
    throw error;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const resetPasswordForEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
  
  if (error) {
    throw error;
  }
};

export const updateUserPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw error;
  }
};
