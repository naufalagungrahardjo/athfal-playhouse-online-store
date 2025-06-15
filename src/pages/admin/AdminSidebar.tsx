
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationItem } from "./helpers/getAdminNavigation";
import React from "react";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navigation: NavigationItem[];
};

const AdminSidebar: React.FC<Props> = ({ sidebarOpen, setSidebarOpen, navigation }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4">
              <Link to="/admin" className="flex items-center text-lg font-semibold">
                Athfal Admin
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-6 py-3 text-sm font-medium hover:bg-gray-200",
                        location.pathname === item.href ? "bg-gray-200" : "bg-transparent"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-gray-200">
        <div className="px-6 py-4">
          <Link to="/admin" className="flex items-center text-lg font-semibold">
            Athfal Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-6 py-3 text-sm font-medium hover:bg-gray-200",
                    location.pathname === item.href ? "bg-gray-200" : "bg-transparent"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
