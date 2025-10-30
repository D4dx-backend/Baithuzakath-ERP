import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  Building2,
  MapPin,
  FileCheck,
  UserCheck,
  Clock,
  Wallet,
  ChevronDown,
  Search,
  CalendarCheck,
  Shield,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRBAC } from "@/hooks/useRBAC";

const menuCategories = [
  {
    label: null,
    items: [
      { 
        to: "/dashboard", 
        icon: LayoutDashboard, 
        label: "Dashboard",
        permissions: [] // All authenticated users
      },
    ]
  },
  {
    label: "Projects Management",
    items: [
      { 
        to: "/projects", 
        icon: FolderKanban, 
        label: "Projects",
        permissions: ["projects.read.all", "projects.read.assigned"]
      },
      { 
        to: "/schemes", 
        icon: FileText, 
        label: "Schemes",
        permissions: ["schemes.read.all", "schemes.read.assigned"]
      },
      { 
        to: "/applications", 
        icon: FileCheck, 
        label: "Applications",
        permissions: ["applications.read.all", "applications.read.regional", "applications.read.own"]
      },
      { 
        to: "/upcoming-interviews", 
        icon: CalendarCheck, 
        label: "Upcoming Interviews",
        permissions: ["interviews.read", "applications.read.all", "applications.read.regional"]
      },
      { 
        to: "/beneficiaries", 
        icon: UserCheck, 
        label: "Beneficiaries",
        permissions: ["beneficiaries.read.all", "beneficiaries.read.regional", "beneficiaries.read.own"]
      },
    ]
  },
  {
    label: "Financial Management",
    items: [
      { 
        to: "/payment-distribution", 
        icon: Wallet, 
        label: "Payment Distribution",
        permissions: ["finances.read.all", "finances.read.regional", "finances.manage"]
      },
      { 
        to: "/payment-tracking", 
        icon: Clock, 
        label: "Payment Tracking",
        permissions: ["finances.read.all", "finances.read.regional"]
      },
      { 
        to: "/budget", 
        icon: DollarSign, 
        label: "Budget & Expenses",
        permissions: ["finances.read.all", "finances.read.regional", "finances.manage"]
      },
      { 
        label: "Donors",
        icon: Users,
        permissions: ["donors.read", "donors.read.regional", "donors.read.all"],
        submenu: [
          {
            to: "/donors/all",
            label: "All Donors",
            permissions: ["donors.read", "donors.read.regional", "donors.read.all"]
          },
          {
            to: "/donors/donations",
            label: "Donations",
            permissions: ["donations.create", "donations.read"]
          },
          {
            to: "/donors/history",
            label: "Donation History",
            permissions: ["donations.read", "donations.read.all"]
          }
        ]
      },
    ]
  },
  {
    label: "System Administration",
    items: [
      { 
        to: "/locations", 
        icon: MapPin, 
        label: "Locations",
        permissions: ["locations.read", "settings.read"]
      },
      { 
        to: "/users", 
        icon: Building2, 
        label: "User Management",
        permissions: ["users.read.all", "users.read.regional"]
      },
      { 
        to: "/roles", 
        icon: Shield, 
        label: "Role Management",
        permissions: ["roles.read"]
      },
      { 
        to: "/form-builder", 
        icon: Wrench, 
        label: "Form Builder",
        permissions: ["forms.read", "forms.create", "forms.manage"]
      },
    ]
  },
  {
    label: "System Tools",
    items: [
      { 
        to: "/debug-permissions", 
        icon: Search, 
        label: "Debug Permissions",
        permissions: ["system.debug", "permissions.read"]
      },
    ]
  },
  {
    label: null,
    items: [
      { 
        to: "/communications", 
        icon: MessageSquare, 
        label: "Communications",
        permissions: ["communications.send"]
      },
      { 
        to: "/settings", 
        icon: Settings, 
        label: "Settings",
        permissions: ["settings.read", "settings.update"]
      },
    ]
  },
];

const allNavItems = menuCategories.flatMap(cat => 
  cat.items.flatMap(item => 
    item.submenu ? item.submenu : [item]
  )
);

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { hasAnyPermission } = useRBAC();
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Projects Management": true,
    "Financial Management": true,
    "Administration": true,
    "Donors": true,
  });

  const toggleCategory = (label: string) => {
    setOpenCategories(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter menu items based on permissions
  const hasAccessToItem = (item: any) => {
    if (!item.permissions || item.permissions.length === 0) {
      return true; // No permissions required
    }
    return hasAnyPermission(item.permissions);
  };

  // Filter categories to only show items user has access to
  const filteredCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(hasAccessToItem)
  })).filter(category => category.items.length > 0);

  const filteredItems = searchQuery
    ? allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
        hasAccessToItem(item)
      )
    : null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-card transition-transform duration-300 md:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {filteredItems ? (
            // Search results
            filteredItems.length > 0 ? (
              filteredItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No menu items found
              </div>
            )
          ) : (
            // Categorized menu
            filteredCategories.map((category, idx) => (
              <div key={idx} className="mb-4">
                {category.label ? (
                  <Collapsible
                    open={openCategories[category.label]}
                    onOpenChange={() => toggleCategory(category.label!)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                      {category.label}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          openCategories[category.label] && "transform rotate-180"
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {category.items.map((item) => (
                        item.submenu ? (
                          // Item with submenu
                          <Collapsible
                            key={item.label}
                            open={openCategories[item.label]}
                            onOpenChange={() => toggleCategory(item.label)}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-5 w-5" />
                                {item.label}
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  openCategories[item.label] && "transform rotate-180"
                                )}
                              />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-1 mt-1 ml-6">
                              {item.submenu.filter(hasAccessToItem).map((subItem) => (
                                <NavLink
                                  key={subItem.to}
                                  to={subItem.to}
                                  onClick={onClose}
                                  className={({ isActive }) =>
                                    cn(
                                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                      isActive
                                        ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )
                                  }
                                >
                                  {subItem.label}
                                </NavLink>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          // Regular item
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )
                            }
                          >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </NavLink>
                        )
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  // Uncategorized items
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}
