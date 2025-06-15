
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '@/types/auth';
import { loadUserProfile } from '@/utils/auth';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthStateChange] event:', event, 'session:', session);
        setSession(session);
        
        if (session?.user) {
          const userData = await loadUserProfile(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
        console.log('[AuthStateChange] setLoading(false)');
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user).then(userData => {
          setUser(userData);
          setLoading(false);
          console.log('[GetSession] Got user, setLoading(false)');
        });
      } else {
        setUser(null);
        setLoading(false);
        console.log('[GetSession] No user, setLoading(false)');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('[useAuthState] user:', user, 'session:', session, 'loading:', loading);
  }, [user, session, loading]);

  return { user, session, loading, setUser, setSession };
};

