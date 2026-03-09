
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching users:', error);
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      logger.error('Error fetching users:', error);
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
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        logger.error('Delete user error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      await fetchUsers();
    } catch (error) {
      logger.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user"
      });
    }
  };

  const resetPassword = async (userId: string, newPassword: string) => {
    try {
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

      toast({
        title: "Success",
        description: "Password reset successfully"
      });
    } catch (error: any) {
      logger.error('Error resetting password:', error);
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
