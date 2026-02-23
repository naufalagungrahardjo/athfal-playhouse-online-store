
import { useState, useRef } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRole } from "./helpers/getAdminRole";
import { getAdminNavigation } from "./helpers/getAdminNavigation";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const wasAdmin = useRef(false);

  // Track if user was previously authenticated as admin
  if (user && isAdmin()) {
    wasAdmin.current = true;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Only redirect if user was never admin in this session (prevents redirect during token refresh)
  if (!user || !isAdmin()) {
    if (!wasAdmin.current) {
      return <Navigate to="/" replace />;
    }
    // During token refresh, show loading instead of redirecting
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Refreshing session...</div>
      </div>
    );
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
