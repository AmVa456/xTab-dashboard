import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGenerateContent, useSuggestHashtags, useAIStatus } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Hash, Loader2, X } from "lucide-react";
import AIImageGenerator from "./ai-image-generator";
import type { Post, Platform, InsertPost, CoverImage } from "@shared/schema";

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  platformId: z.string().min(1, "Platform is required"),
  status: z.enum(["draft", "published", "scheduled", "failed"]),
  scheduledFor: z.string().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

interface PostFormProps {
  post?: Post | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PostForm({ post, onSubmit, onCancel }: PostFormProps) {
  const { toast } = useToast();
  const isEditing = !!post;
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [selectedCoverImage, setSelectedCoverImage] = useState<CoverImage | null>(
    post?.coverImage || null
  );

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: aiStatus } = useAIStatus();
  const generateContentMutation = useGenerateContent();
  const suggestHashtagsMutation = useSuggestHashtags();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      platformId: post?.platformId || "",
      status: (post?.status as "draft" | "published" | "scheduled" | "failed") || "draft",
      scheduledFor: post?.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : "",
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        platformId: post.platformId,
        status: post.status as "draft" | "published" | "scheduled" | "failed",
        scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : "",
      });
      setSelectedCoverImage(post.coverImage || null);
    }
  }, [post, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const postData: InsertPost = {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === "published" ? new Date() : null,
        coverImage: selectedCoverImage,
      };
      
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      onSubmit();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const updates = {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === "published" && post?.status !== "published" ? new Date() : post?.publishedAt,
        coverImage: selectedCoverImage,
      };
      
      const response = await apiRequest("PUT", `/api/posts/${post!.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      onSubmit();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PostFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // AI Feature Handlers
  const handleGenerateContent = async () => {
    const title = form.getValues("title");
    const platformId = form.getValues("platformId");
    
    if (!title) {
      toast({
        title: "Topic Required",
        description: "Please enter a title/topic first to generate content",
        variant: "destructive",
      });
      return;
    }

    try {
      const platform = platforms.find(p => p.id === platformId);
      const result = await generateContentMutation.mutateAsync({
        topic: title,
        platform: platform?.name,
        tone: "professional",
        length: "medium",
      });

      if (result.title) form.setValue("title", result.title);
      if (result.excerpt) form.setValue("excerpt", result.excerpt);
      if (result.content) form.setValue("content", result.content);

      toast({
        title: "Content Generated",
        description: "AI has generated content suggestions for your post",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  const handleSuggestHashtags = async () => {
    const content = form.getValues("content");
    const platformId = form.getValues("platformId");
    
    if (!content) {
      toast({
        title: "Content Required",
        description: "Please enter content first to suggest hashtags",
        variant: "destructive",
      });
      return;
    }

    try {
      const platform = platforms.find(p => p.id === platformId);
      const result = await suggestHashtagsMutation.mutateAsync({
        content,
        platform: platform?.name,
        count: 5,
      });

      setSuggestedHashtags(result.hashtags);
      toast({
        title: "Hashtags Suggested",
        description: `Generated ${result.hashtags.length} hashtag suggestions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suggest hashtags",
        variant: "destructive",
      });
    }
  };

  const addHashtagToContent = (hashtag: string) => {
    const currentContent = form.getValues("content");
    const newContent = currentContent 
      ? `${currentContent}\n\n${hashtag}` 
      : hashtag;
    form.setValue("content", newContent);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit Post" : "Create New Post"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter post title..."
                    {...field}
                    data-testid="input-post-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* AI Features Section */}
          {aiStatus?.enabled && (
            <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border border-dashed">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={generateContentMutation.isPending || isPending}
                className="gap-2"
              >
                {generateContentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Generate Content
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestHashtags}
                disabled={suggestHashtagsMutation.isPending || isPending}
                className="gap-2"
              >
                {suggestHashtagsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Hash className="h-4 w-4" />
                )}
                Suggest Hashtags
              </Button>
              
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Sparkles className="h-3 w-3" />
                AI-Powered Features
              </span>
            </div>
          )}

          {/* AI Image Generator */}
          {aiStatus?.enabled && (
            <AIImageGenerator
              postTitle={form.watch("title")}
              postContent={form.watch("content")}
              currentImage={selectedCoverImage}
              onImageSelect={setSelectedCoverImage}
              disabled={isPending}
            />
          )}

          {/* Display suggested hashtags */}
          {suggestedHashtags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Suggested Hashtags</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuggestedHashtags([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedHashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-xtab-blue hover:text-white transition-colors"
                    onClick={() => addHashtagToContent(hashtag)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a hashtag to add it to your content
              </p>
            </div>
          )}

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Brief description or excerpt..."
                    {...field}
                    data-testid="input-post-excerpt"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your post content..."
                    className="min-h-40"
                    {...field}
                    data-testid="input-post-content"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="platformId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${platform.color} rounded mr-2`}></div>
                            {platform.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.watch("status") === "scheduled" && (
            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule For</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      data-testid="input-scheduled-for"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="xtab-gradient"
              data-testid="button-submit-post"
            >
              {isPending ? "Saving..." : isEditing ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
