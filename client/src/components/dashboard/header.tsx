import { Search, Plus, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreatePost: () => void;
  onMobileMenuToggle?: () => void;
}

export default function Header({ searchQuery, onSearchChange, onCreatePost, onMobileMenuToggle }: HeaderProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-card shadow-md border-b border-border">
      <button 
        onClick={onMobileMenuToggle}
        className="px-4 border-r border-border text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
        aria-label="Open mobile menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex items-center">
          <h2 className="text-xl font-semibold text-foreground">
            Post Management Dashboard
          </h2>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              data-testid="search-input"
            />
          </div>
          
          <Button
            onClick={onCreatePost}
            className="xtab-gradient px-4 py-2 rounded-md text-sm font-medium hover:shadow-lg transition-all duration-200 h-10"
            data-testid="button-create-post"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">New Post</span>
          </Button>
          
          <button 
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            data-testid="button-notifications"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
