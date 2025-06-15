
import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRole } from "./helpers/getAdminRole";
import { getAdminNavigation } from "./helpers/getAdminNavigation";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect non-admin users to home page
  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  const adminRole = getAdminRole(user);
  const navigation = getAdminNavigation(adminRole);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigation={navigation}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
