import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../../infrastructure/supabase/server';
import { UsersClient } from './users-client';

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: users } = await supabase.from('profiles').select('*').order('created_at').returns<Array<{ id: string; full_name: string; role: string; avatar_url: string | null; created_at: string; updated_at: string }>>();

  return <UsersClient initialUsers={users ?? []} currentUserId={user.id} />;
}
