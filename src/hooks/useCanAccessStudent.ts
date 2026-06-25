import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Determines whether the current user may see/open the Student menu.
 * Access is granted to admin/staff accounts and to verified buyers
 * who have at least one order with a "processing" or "completed" status.
 */
export const useCanAccessStudent = () => {
  const { user } = useAuth();
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCanAccess(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc('can_access_student_menu' as any);
      if (!cancelled) {
        setCanAccess(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { canAccess, loading };
};
