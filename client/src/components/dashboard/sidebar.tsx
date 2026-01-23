import { useQuery } from "@tanstack/react-query";
import { Home, BookOpen, FileText, BarChart3, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Platform } from "@shared/schema";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 pt-5 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 xtab-logo rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">x</span>
          </div>
          <h1 className="ml-3 text-xl font-bold text-foreground">xTab</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
        <button
          onClick={() => onTabChange("all")}
          className={`w-full group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            activeTab === "all"
              ? "xtab-gradient"
              : "text-foreground hover:bg-accent"
          }`}
          data-testid="nav-dashboard"
        >
          <Home className={`mr-3 h-5 w-5 flex-shrink-0 ${activeTab === "all" ? "text-background" : "text-muted-foreground"}`} />
          Dashboard
        </button>
        
        <button
          onClick={() => onTabChange("posts")}
          className={`w-full group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            activeTab === "posts"
              ? "xtab-gradient"
              : "text-foreground hover:bg-accent"
          }`}
          data-testid="nav-post-library"
        >
          <BookOpen className={`mr-3 h-5 w-5 flex-shrink-0 ${activeTab === "posts" ? "text-background" : "text-muted-foreground"}`} />
          Post Library
        </button>
        
        <button
          className="w-full text-foreground hover:bg-accent group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px]"
          data-testid="nav-templates"
        >
          <FileText className="text-muted-foreground mr-3 h-5 w-5 flex-shrink-0" />
          Templates
        </button>
        
        <button
          className="w-full text-foreground hover:bg-accent group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px]"
          data-testid="nav-analytics"
        >
          <BarChart3 className="text-muted-foreground mr-3 h-5 w-5 flex-shrink-0" />
          Analytics
        </button>
        
        <button
          className="w-full text-foreground hover:bg-accent group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors min-h-[44px]"
          data-testid="nav-scheduler"
        >
          <Clock className="text-muted-foreground mr-3 h-5 w-5 flex-shrink-0" />
          Scheduler
        </button>
      </nav>

      {/* Connected Platforms */}
      <div className="mt-6 px-2 pb-4">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Connected Platforms
        </h3>
        <div className="mt-2 space-y-1">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center px-2 py-2 text-sm text-foreground">
              <div className={`w-4 h-4 ${platform.color} rounded mr-2 flex-shrink-0`}></div>
              <span className="flex-1" data-testid={`platform-${platform.name.toLowerCase()}`}>
                {platform.name}
              </span>
              <span 
                className={`ml-auto text-xs ${
                  platform.isConnected ? "text-xtab-emerald" : "text-muted-foreground"
                }`}
                data-testid={`platform-status-${platform.name.toLowerCase()}`}
              >
                ●
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-64 p-0 bg-card">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent activeTab={activeTab} onTabChange={(tab) => {
            onTabChange(tab);
            onMobileClose?.();
          }} />
        </SheetContent>
      </Sheet>
    </>
  );
}
