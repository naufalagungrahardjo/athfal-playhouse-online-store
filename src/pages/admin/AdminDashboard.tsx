
import { DashboardStats } from '@/components/admin/DashboardStats';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <DashboardStats />
      
      <div className="text-center py-8">
        <p className="text-gray-500">Additional dashboard content will be implemented here.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
