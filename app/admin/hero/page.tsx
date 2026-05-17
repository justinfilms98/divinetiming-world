import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DashboardHeroEditor } from '@/components/admin/DashboardHeroEditor';

export default function AdminHeroPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Hero"
        description="Edit hero media, carousel slots, and copy for each public page."
      />
      <DashboardHeroEditor />
    </div>
  );
}
