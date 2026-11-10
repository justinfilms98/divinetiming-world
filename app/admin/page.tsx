import { AdminPage } from '@/components/admin/AdminPage';
import { DashboardHome } from '@/components/admin/dashboard/DashboardHome';

export default function AdminDashboard() {
  return (
    <AdminPage title="Dashboard">
      <DashboardHome />
    </AdminPage>
  );
}
