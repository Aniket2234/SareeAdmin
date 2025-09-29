import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Store, 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Manage Shops", href: "/shops", icon: Store },
  { name: "Product Catalog", href: "/catalog", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center h-16 px-6 border-b border-border bg-primary">
          <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center mr-3">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-primary-foreground font-semibold">Admin Panel</h1>
            <p className="text-primary-foreground/70 text-xs">Airavata Technologies</p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center mb-4">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground" data-testid="text-username">
                {user?.username || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-email">
                {user?.email || "admin@airavata.tech"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}
