import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import StatsCards from "@/components/dashboard/stats-cards";
import PostsTable from "@/components/dashboard/posts-table";
import RecentActivity from "@/components/dashboard/recent-activity";
import QuickActions from "@/components/dashboard/quick-actions";
import AIPostComposer from "@/components/forms/ai-post-composer";
import AIAssistant from "@/components/dashboard/ai-assistant";
import StaticModeBanner from "@/components/dashboard/static-mode-banner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAIStatus } from "@/hooks/use-ai";
import type { Post } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data: aiStatus } = useAIStatus();

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setShowEditModal(true);
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
          onCreatePost={handleCreatePost}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* AI Assistant Floating Button */}
          {aiStatus?.enabled && (
            <div className="fixed bottom-6 right-6 z-50">
              <Sheet open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                <SheetTrigger asChild>
                  <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg xtab-gradient hover:shadow-xl transition-all"
                    aria-label="Open AI Assistant"
                  >
                    <Sparkles className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-[500px] flex flex-col p-0">
                  <SheetHeader className="p-6 pb-0">
                    <SheetTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-xtab-blue" />
                      AI Assistant
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 p-6 pt-4">
                    <AIAssistant />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <StaticModeBanner />
              <StatsCards />
              
              <PostsTable 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchQuery={searchQuery}
                filterPlatform={filterPlatform}
                onFilterPlatformChange={setFilterPlatform}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                onEditPost={handleEditPost}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                  <RecentActivity />
                </div>
                <div>
                  <QuickActions onCreatePost={handleCreatePost} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AIPostComposer 
            onSubmit={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AIPostComposer 
            post={selectedPost}
            onSubmit={() => {
              setShowEditModal(false);
              setSelectedPost(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPost(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
