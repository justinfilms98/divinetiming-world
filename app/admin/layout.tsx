import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminLayout } from '@/components/admin/AdminLayout';

/** Admins are the emails in public.admin_users (the same list the API and storage policies use). */
export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user.email.toLowerCase())
    .single();

  if (!data) {
    redirect('/');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
