
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationGroup } from "./helpers/getAdminNavigation";
import React, { useState, useRef, useEffect } from "react";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navigation: NavigationGroup[];
};

const SidebarNav: React.FC<{ groups: NavigationGroup[]; onItemClick?: () => void }> = ({ groups, onItemClick }) => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open group containing current route
    const init: Record<string, boolean> = {};
    groups.forEach(g => {
      if (g.items.some(i => location.pathname === i.href)) {
        init[g.label] = true;
      }
    });
    return init;
  });

  const toggle = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const isOpen = openGroups[group.label] ?? false;
        const hasActive = group.items.some(i => location.pathname === i.href);

        return (
          <div key={group.label}>
            <button
              onClick={() => toggle(group.label)}
              className={cn(
                "flex items-center justify-between w-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                hasActive && "text-gray-700"
              )}
              aria-label={`Toggle ${group.label} menu`}
            >
              <span>{group.label}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <ul className="space-y-0.5 pb-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center pl-8 pr-6 py-2 text-sm font-medium hover:bg-gray-200 transition-colors",
                        location.pathname === item.href ? "bg-gray-200 text-gray-900" : "text-gray-600"
                      )}
                      onClick={onItemClick}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AdminSidebar: React.FC<Props> = ({ sidebarOpen, setSidebarOpen, navigation }) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open admin menu">
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
              <SidebarNav groups={navigation} onItemClick={() => setSidebarOpen(false)} />
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
          <SidebarNav groups={navigation} />
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
