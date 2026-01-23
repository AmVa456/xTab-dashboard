import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit2, Eye, Trash2, Filter, List, Heart, MessageCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Post, Platform } from "@shared/schema";

interface PostsTableProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  filterPlatform: string;
  onFilterPlatformChange: (platform: string) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  onEditPost: (post: Post) => void;
}

export default function PostsTable({
  activeTab,
  onTabChange,
  searchQuery,
  filterPlatform,
  onFilterPlatformChange,
  filterStatus,
  onFilterStatusChange,
  onEditPost,
}: PostsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { platform: filterPlatform, status: filterStatus }],
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  // Filter posts based on search and active tab
  const filteredPosts = posts.filter((post) => {
    const platform = platforms.find(p => p.id === post.platformId);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "forums" && platform?.type === "forum") ||
      (activeTab === "blogs" && platform?.type === "blog") ||
      (activeTab === "social" && platform?.type === "social");

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "bg-green-100 text-green-800",
      scheduled: "bg-yellow-100 text-yellow-800",
      draft: "bg-muted/30 text-foreground",
      failed: "bg-red-100 text-red-800",
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const formatDate = (date: string | null, scheduledFor?: string | null) => {
    if (!date && !scheduledFor) return "Draft";
    
    const targetDate = scheduledFor || date;
    if (!targetDate) return "Draft";
    
    const dateObj = new Date(targetDate);
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (scheduledFor) {
      return diffInHours < 0 ? 
        `${Math.abs(Math.floor(diffInHours / 24))}d from now` :
        dateObj.toLocaleDateString();
    }
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return dateObj.toLocaleDateString();
  };

  const tabCounts = {
    all: posts.length,
    forums: posts.filter(p => platforms.find(pl => pl.id === p.platformId)?.type === "forum").length,
    blogs: posts.filter(p => platforms.find(pl => pl.id === p.platformId)?.type === "blog").length,
    social: posts.filter(p => platforms.find(pl => pl.id === p.platformId)?.type === "social").length,
  };

  const tabs = [
    { id: "all", label: "All Posts", count: tabCounts.all },
    { id: "forums", label: "Forums", count: tabCounts.forums },
    { id: "blogs", label: "Blogs", count: tabCounts.blogs },
    { id: "social", label: "Social", count: tabCounts.social },
  ];

  if (postsLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted/30 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow mb-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm rounded-t-lg ${
                activeTab === tab.id
                  ? "tab-active text-white border-transparent"
                  : "text-muted-foreground hover:text-foreground hover:border-border border-transparent"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              <span 
                className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                  activeTab === tab.id 
                    ? "bg-white bg-opacity-20 text-white" 
                    : "bg-muted/30 text-foreground"
                }`}
                data-testid={`tab-count-${tab.id}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <CardContent className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Select value={filterPlatform} onValueChange={onFilterPlatformChange}>
              <SelectTrigger className="w-40" data-testid="filter-platform">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={onFilterStatusChange}>
              <SelectTrigger className="w-32" data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" data-testid="button-view-toggle">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredPosts.map((post) => {
                const platform = platforms.find(p => p.id === post.platformId);
                return (
                  <tr key={post.id} className="hover:bg-muted/30" data-testid={`post-row-${post.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <span className="text-foreground font-medium text-xs">
                              {post.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div 
                            className="text-sm font-medium text-foreground"
                            data-testid={`post-title-${post.id}`}
                          >
                            {post.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {post.excerpt || post.content.substring(0, 50) + "..."}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 ${platform?.color || "bg-slate-400"} rounded mr-2`}></div>
                        <span 
                          className="text-sm text-foreground"
                          data-testid={`post-platform-${post.id}`}
                        >
                          {platform?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        className={getStatusBadge(post.status)}
                        data-testid={`post-status-${post.id}`}
                      >
                        {post.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 text-red-400 mr-1" />
                        <span data-testid={`post-likes-${post.id}`}>
                          {post.likes || "-"}
                        </span>
                        <MessageCircle className="w-4 h-4 text-blue-400 ml-3 mr-1" />
                        <span data-testid={`post-comments-${post.id}`}>
                          {post.comments || "-"}
                        </span>
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                      data-testid={`post-date-${post.id}`}
                    >
                      {formatDate(
                        post.publishedAt ? post.publishedAt.toString() : null, 
                        post.scheduledFor ? post.scheduledFor.toString() : null
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPost(post)}
                          className="text-xtab-pink hover:text-xtab-pink-dark"
                          data-testid={`button-edit-${post.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`button-view-${post.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                          className="text-red-400 hover:text-red-600"
                          data-testid={`button-delete-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button variant="outline" disabled={currentPage === 1}>
              Previous
            </Button>
            <Button variant="outline">Next</Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-foreground" data-testid="pagination-info">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{Math.min(10, filteredPosts.length)}</span> of{" "}
                <span className="font-medium">{filteredPosts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-xtab-pink text-white"
                  data-testid="button-page-1"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" data-testid="button-next-page">
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
