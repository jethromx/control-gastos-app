'use server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../../infrastructure/supabase/server';

export async function inviteUser(email: string): Promise<{ error?: string }> {
  const serverClient = await createServerSupabaseClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data: profile } = await serverClient.from('profiles').select('role').eq('id', user.id).single<{ role: string }>();
  if (profile?.role !== 'admin') return { error: 'No autorizado' };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { error: 'Service role key no configurada' };

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) return { error: error.message };
  return {};
}
