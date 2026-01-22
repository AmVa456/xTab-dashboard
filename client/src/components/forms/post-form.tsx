import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  useGenerateContent, 
  useGenerateImage, 
  useSuggestHashtags, 
  useAIStatus,
  useSaveHashtagSuggestions,
  useUpdateHashtagSelection 
} from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Hash, Image as ImageIcon, Loader2, X } from "lucide-react";
import HashtagSuggestions from "./hashtag-suggestions";
import type { Post, Platform, InsertPost } from "@shared/schema";

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  platformId: z.string().min(1, "Platform is required"),
  status: z.enum(["draft", "published", "scheduled", "failed"]),
  scheduledFor: z.string().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

interface Hashtag {
  tag: string;
  relevanceScore: number;
  trending: boolean;
  category: 'primary' | 'secondary' | 'broad';
  isAIGenerated?: boolean;
  selected?: boolean;
}

interface PostFormProps {
  post?: Post | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PostForm({ post, onSubmit, onCancel }: PostFormProps) {
  const { toast } = useToast();
  const isEditing = !!post;
  const [suggestedHashtags, setSuggestedHashtags] = useState<Hashtag[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [hashtagSuggestionId, setHashtagSuggestionId] = useState<string | null>(null);
  const contentDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: aiStatus } = useAIStatus();
  const generateContentMutation = useGenerateContent();
  const generateImageMutation = useGenerateImage();
  const suggestHashtagsMutation = useSuggestHashtags();
  const saveHashtagSuggestions = useSaveHashtagSuggestions();
  const updateHashtagSelection = useUpdateHashtagSelection();

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
    }
  }, [post, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const postData: InsertPost = {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === "published" ? new Date() : null,
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

  const handleGenerateImage = async () => {
    const title = form.getValues("title");
    const content = form.getValues("content");
    
    if (!title && !content) {
      toast({
        title: "Content Required",
        description: "Please enter a title or content first to generate an image",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateImageMutation.mutateAsync({
        description: title || content.slice(0, 100),
        style: "modern and professional",
      });

      if (result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        toast({
          title: "Image Generated",
          description: "AI has generated an image concept for your post",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  const handleSuggestHashtags = async (autoUpdate = false) => {
    const content = form.getValues("content");
    const platformId = form.getValues("platformId");
    
    if (!content || content.length < 20) {
      if (!autoUpdate) {
        toast({
          title: "Content Required",
          description: "Please enter at least 20 characters of content to suggest hashtags",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const platform = platforms.find(p => p.id === platformId);
      const result = await suggestHashtagsMutation.mutateAsync({
        content,
        platform: platform?.name,
        count: 8,
        includeTrending: true,
      });

      // Transform the response to match our Hashtag interface
      const hashtags: Hashtag[] = result.hashtags.map(h => ({
        tag: h.tag,
        relevanceScore: h.relevanceScore,
        trending: h.trending,
        category: h.category,
        isAIGenerated: true,
        selected: false,
      }));

      setSuggestedHashtags(hashtags);

      // Save to MongoDB if hashtag service is available
      try {
        const savedSuggestion = await saveHashtagSuggestions.mutateAsync({
          postId: post?.id,
          content,
          platform: platform?.name,
          hashtags: hashtags.map(h => ({
            tag: h.tag,
            isAIGenerated: true,
            relevanceScore: h.relevanceScore,
            trending: h.trending,
            selected: false,
            selectionCount: 0,
          })),
        });

        if (savedSuggestion?.id) {
          setHashtagSuggestionId(savedSuggestion.id);
        }
      } catch (saveError) {
        // MongoDB save failed, but we still have the suggestions
        console.log("Failed to save hashtag suggestions to MongoDB:", saveError);
      }

      if (!autoUpdate) {
        toast({
          title: "Hashtags Suggested",
          description: `Generated ${hashtags.length} intelligent hashtag suggestions`,
        });
      }
    } catch (error) {
      if (!autoUpdate) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to suggest hashtags",
          variant: "destructive",
        });
      }
    }
  };

  // Real-time hashtag update based on content changes
  const handleContentChange = useCallback((content: string) => {
    // Clear existing timer
    if (contentDebounceTimer.current) {
      clearTimeout(contentDebounceTimer.current);
    }

    // Only auto-update if we already have suggestions and content is substantial
    if (suggestedHashtags.length > 0 && content.length > 50) {
      contentDebounceTimer.current = setTimeout(() => {
        handleSuggestHashtags(true); // Auto-update without showing toast
      }, 3000); // Wait 3 seconds after user stops typing
    }
  }, [suggestedHashtags.length]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (contentDebounceTimer.current) {
        clearTimeout(contentDebounceTimer.current);
      }
    };
  }, [contentDebounceTimer]);

  const handleHashtagClick = (hashtag: string) => {
    const currentContent = form.getValues("content");
    // Check if hashtag already exists in content
    if (currentContent.includes(hashtag)) {
      toast({
        title: "Already Added",
        description: `${hashtag} is already in your content`,
      });
      return;
    }

    const newContent = currentContent 
      ? `${currentContent}\n\n${hashtag}` 
      : hashtag;
    form.setValue("content", newContent);
    
    toast({
      title: "Hashtag Added",
      description: `${hashtag} added to your content`,
    });
  };

  const handleHashtagSelect = async (hashtag: string, selected: boolean) => {
    if (!hashtagSuggestionId) return;

    try {
      await updateHashtagSelection.mutateAsync({
        suggestionId: hashtagSuggestionId,
        hashtag,
        selected,
      });

      // Update local state
      setSuggestedHashtags(prev =>
        prev.map(h =>
          h.tag === hashtag ? { ...h, selected } : h
        )
      );
    } catch (error) {
      console.error("Failed to update hashtag selection:", error);
    }
  };

  const addHashtagToContent = (hashtag: string) => {
    handleHashtagClick(hashtag);
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
                onClick={handleGenerateImage}
                disabled={generateImageMutation.isPending || isPending}
                className="gap-2"
              >
                {generateImageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                AI Generate Image
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

          {/* Display generated image */}
          {generatedImageUrl && (
            <div className="relative">
              <img 
                src={generatedImageUrl} 
                alt="AI Generated" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setGeneratedImageUrl("")}
              >
                <X className="h-4 w-4" />
              </Button>
              <Badge className="absolute bottom-2 left-2 gap-1">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </Badge>
            </div>
          )}

          {/* Display suggested hashtags with enhanced component */}
          {suggestedHashtags.length > 0 && (
            <HashtagSuggestions
              hashtags={suggestedHashtags}
              onHashtagClick={handleHashtagClick}
              onHashtagSelect={handleHashtagSelect}
              onDismiss={() => setSuggestedHashtags([])}
              isLoading={suggestHashtagsMutation.isPending}
            />
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
                    onChange={(e) => {
                      field.onChange(e);
                      handleContentChange(e.target.value);
                    }}
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
