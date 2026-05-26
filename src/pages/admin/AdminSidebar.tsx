
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavigationGroup } from "./helpers/getAdminNavigation";
import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useParentMessageThreads } from "@/hooks/useParentMessages";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navigation: NavigationGroup[];
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const SidebarNav: React.FC<{ groups: NavigationGroup[]; onItemClick?: () => void; collapsed?: boolean }> = ({ groups, onItemClick, collapsed = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { threads, reads } = useParentMessageThreads("all");
  const inboxUnread = user ? threads.filter(t => {
    const lr = reads[t.id];
    return !lr || new Date(t.last_activity_at) > new Date(lr);
  }).length : 0;
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
                "flex items-center justify-between w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                collapsed ? "px-2" : "px-6",
                hasActive && "text-gray-700"
              )}
              aria-label={`Toggle ${group.label} menu`}
            >
              {collapsed ? (
                <span className="truncate w-full text-center">{group.label.substring(0, 1)}</span>
              ) : (
                <>
                  <span>{group.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                </>
              )}
            </button>
            {isOpen && (
              <ul className="space-y-0.5 pb-1">
                {group.items.map((item) => {
                  const linkContent = collapsed ? (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center w-full relative">
                            <item.icon className="h-4 w-4" />
                            {item.href === '/admin/inbox' && inboxUnread > 0 && (
                              <span className="absolute -top-1 -right-1 bg-athfal-pink text-white text-[9px] rounded-full min-w-[14px] h-3.5 px-1 flex items-center justify-center">{inboxUnread}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.name}{item.href === '/admin/inbox' && inboxUnread > 0 ? ` (${inboxUnread})` : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                      </span>
                      {item.href === '/admin/inbox' && inboxUnread > 0 && (
                        <span className="bg-athfal-pink text-white text-[10px] rounded-full min-w-[18px] h-4 px-1.5 flex items-center justify-center">{inboxUnread}</span>
                      )}
                    </span>
                  );

                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center py-2 text-sm font-medium hover:bg-gray-200 transition-colors",
                          collapsed ? "px-2 justify-center" : "pl-8 pr-6",
                          location.pathname === item.href ? "bg-gray-200 text-gray-900" : "text-gray-600"
                        )}
                        onClick={onItemClick}
                      >
                        {linkContent}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AdminSidebar: React.FC<Props> = ({ sidebarOpen, setSidebarOpen, navigation, collapsed, setCollapsed }) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed bottom-4 left-4 z-[60] bg-background/95 backdrop-blur-sm shadow-lg border rounded-full h-12 w-12" aria-label="Open admin menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
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
      <div className={cn(
        "hidden md:flex flex-col border-r border-gray-200 transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("py-4 transition-all", collapsed ? "px-2" : "px-6")}>
          <Link to="/admin" className={cn("flex items-center text-lg font-semibold", collapsed && "justify-center")}>
            {collapsed ? "A" : "Athfal Admin"}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav groups={navigation} collapsed={collapsed} />
        </div>
        <div className="border-t border-gray-200 p-2 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
