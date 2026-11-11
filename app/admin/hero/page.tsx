import { AdminPage } from '@/components/admin/AdminPage';
import { DashboardHeroEditor } from '@/components/admin/DashboardHeroEditor';
import { HomepageSectionsCard } from '@/components/admin/HomepageSectionsCard';

export default function AdminHeroPage() {
  return (
    <AdminPage
      title="Homepage & Hero"
      subtitle="Edit media, overlay, and copy for each public page. Home uses carousel slots; other pages use a single hero."
    >
      <DashboardHeroEditor />
      <HomepageSectionsCard />
    </AdminPage>
  );
}
