'use client';
import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '../../infrastructure/supabase/client';
import { User } from '../../domain/entities/user.entity';
import { getUserRepository, resetDI } from '../lib/di';

// Module-level cache so navigating between pages doesn't re-fetch the profile.
// Cleared on sign-out via resetAuthCache().
let _cachedProfile: User | null = null;
let _cachedUserId: string | null = null;

export function resetAuthCache() {
  _cachedProfile = null;
  _cachedUserId = null;
}

export function useAuth() {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(_cachedProfile);
  const [loading, setLoading] = useState(_cachedProfile === null);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(user: SupabaseUser | null) {
      setSupabaseUser(user);
      if (user) {
        // Return immediately from cache when navigating between pages.
        if (_cachedUserId === user.id && _cachedProfile) {
          setProfile(_cachedProfile);
          setLoading(false);
          return;
        }
        try {
          const repo = getUserRepository();
          let p = await repo.findById(user.id);
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
          _cachedProfile = p;
          _cachedUserId = user.id;
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        // Sign-out: clear all caches
        _cachedProfile = null;
        _cachedUserId = null;
        resetDI();
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

  const userId = supabaseUser?.id ?? profile?.id;

  return { supabaseUser, profile, loading, isAdmin: profile?.role === 'admin', userId };
}
