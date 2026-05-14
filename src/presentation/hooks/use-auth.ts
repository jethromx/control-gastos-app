'use client';
import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '../../infrastructure/supabase/client';
import { User } from '../../domain/entities/user.entity';
import { getUserRepository } from '../lib/di';

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(user: SupabaseUser | null) {
      setSupabaseUser(user);
      if (user) {
        try {
          const repo = getUserRepository();
          let p = await repo.findById(user.id);
          // Auto-create profile if missing (trigger may not have fired)
          if (!p) {
            try {
              p = await repo.create({
                id: user.id,
                email: user.email ?? '',
                fullName: user.email?.split('@')[0] ?? 'Usuario',
                role: 'user',
              });
            } catch {
              // Profile already exists or table missing — ignore
            }
            p = await repo.findById(user.id);
          }
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data: { user } }) => loadUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // userId is always the Supabase auth ID — available even without a profile row
  const userId = supabaseUser?.id ?? profile?.id;

  return { supabaseUser, profile, loading, isAdmin: profile?.role === 'admin', userId };
}
