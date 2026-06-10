'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/hooks/use-auth-store';
import type { Profile } from '@/types';

export function AuthProvider({ children, profile }: { children: React.ReactNode; profile: Profile | null }) {
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [setProfile]);

  return <>{children}</>;
}
