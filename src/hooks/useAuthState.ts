
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
    let canceled = false;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuthState] Auth state changed:', event, session);

        setSession(session);

        if (session?.user) {
          // Always fetch user profile asynchronously
          loadUserProfile(session.user)
            .then((userData) => {
              console.log('[useAuthState] Loaded user profile:', userData);
              if (!canceled) setUser(userData);
            })
            .catch((err) => {
              console.error('[useAuthState] Failed to load user profile:', err);
              if (!canceled) setUser(null);
            })
            .finally(() => {
              if (!canceled) setLoading(false);
            });
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuthState] Initial session:', session);

      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user)
          .then((userData) => {
            console.log('[useAuthState] Loaded user profile (init):', userData);
            if (!canceled) setUser(userData);
          })
          .catch((err) => {
            console.error('[useAuthState] Failed to load user profile (init):', err);
            if (!canceled) setUser(null);
          })
          .finally(() => {
            if (!canceled) setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('[useAuthState] Failed to get initial session:', err);
      setLoading(false);
    });

    return () => {
      canceled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, setUser, setSession };
};
