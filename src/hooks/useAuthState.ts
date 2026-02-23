
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

        // For SIGNED_OUT, always clear.
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // If we already have a user and the new session is null (token refresh failure,
        // server error, transient issue), keep the current user logged in.
        // Only trust explicit SIGNED_OUT to clear user state.
        if (!session && user) {
          console.warn('[useAuthState] Session became null but user exists, keeping current user (event:', event, ')');
          return;
        }

        setSession(session);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            loadUserProfile(session.user)
              .then((userData) => {
                console.log('[useAuthState] Loaded user profile:', userData);
                if (!canceled) setUser(userData);
              })
              .catch((err) => {
                console.error('[useAuthState] Failed to load user profile:', err);
                // Don't set user to null on profile load failure if we already have a user
              })
              .finally(() => {
                if (!canceled) setLoading(false);
              });
          }, 0);
        } else if (!session) {
          // Only clear user if there's genuinely no session and no existing user
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
