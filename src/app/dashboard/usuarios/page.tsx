import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../../infrastructure/supabase/server';
import { UsersClient } from './users-client';

export default async function UsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: string }>();
  if (profile?.role !== 'admin') redirect('/dashboard');

  const [{ data: users }, { data: investments }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at').returns<Array<{ id: string; full_name: string; role: string; avatar_url: string | null; created_at: string; updated_at: string }>>(),
    supabase.from('investments').select('type, user_id').returns<Array<{ type: string; user_id: string }>>(),
  ]);

  const byType = (investments ?? []).reduce((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return <UsersClient initialUsers={users ?? []} currentUserId={user.id} investmentStats={byType} />;
}
