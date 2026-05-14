import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../infrastructure/supabase/server';
import { DashboardClientLayout } from './client-layout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single<{ role: string; full_name: string }>();

  return (
    <DashboardClientLayout isAdmin={profileData?.role === 'admin'} userName={profileData?.full_name ?? user.email ?? ''}>
      {children}
    </DashboardClientLayout>
  );
}
