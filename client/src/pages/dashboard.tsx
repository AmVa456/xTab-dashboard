import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import StatsCards from "@/components/dashboard/stats-cards";
import PostsTable from "@/components/dashboard/posts-table";
import RecentActivity from "@/components/dashboard/recent-activity";
import QuickActions from "@/components/dashboard/quick-actions";
import PostForm from "@/components/forms/post-form";
import StaticModeBanner from "@/components/dashboard/static-mode-banner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Post } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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
          <PostForm 
            onSubmit={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PostForm 
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
