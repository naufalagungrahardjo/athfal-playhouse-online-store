
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from database...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Users fetched:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('Deleting user:', userId);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Delete user error:', error);
        throw error;
      }

      console.log('User deleted successfully');
      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user"
      });
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
      console.log('Resetting password for user:', userId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        'https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/reset-user-password',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      console.log('Password reset successfully');
      toast({
        title: "Success",
        description: "Password reset successfully"
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password"
      });
      throw error;
    }
  };

  const getUsersInPeriod = (startDate: Date, endDate: Date) => {
    return users.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= startDate && createdAt <= endDate;
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    fetchUsers,
    deleteUser,
    resetPassword,
    getUsersInPeriod
  };
};
