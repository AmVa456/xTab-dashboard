import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  useGenerateContent,
  useAdjustTone,
  useCheckGrammar,
  useAnalyzeEngagement,
  useGenerateHeadline,
  useGenerateSummary,
  useGenerateCTA,
  useOptimizePost,
  useSuggestHashtags,
  useAIStatus,
} from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Hash,
  Loader2,
  Wand2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  X,
  RefreshCw,
  Zap,
} from "lucide-react";
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

interface AIPostComposerProps {
  post?: Post | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function AIPostComposer({ post, onSubmit, onCancel }: AIPostComposerProps) {
  const { toast } = useToast();
  const isEditing = !!post;
  
  // AI state
  const [aiMetadata, setAiMetadata] = useState<any>({
    isAIGenerated: false,
    modifications: [],
  });
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [grammarResult, setGrammarResult] = useState<any>(null);
  const [engagementResult, setEngagementResult] = useState<any>(null);
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
  const [ctaSuggestions, setCtaSuggestions] = useState<string[]>([]);

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: aiStatus } = useAIStatus();
  
  // AI hooks
  const generateContentMutation = useGenerateContent();
  const adjustToneMutation = useAdjustTone();
  const checkGrammarMutation = useCheckGrammar();
  const analyzeEngagementMutation = useAnalyzeEngagement();
  const generateHeadlineMutation = useGenerateHeadline();
  const generateSummaryMutation = useGenerateSummary();
  const generateCTAMutation = useGenerateCTA();
  const optimizePostMutation = useOptimizePost();
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
      // Load existing AI metadata if available
      if ((post as any).aiMetadata) {
        setAiMetadata((post as any).aiMetadata);
      }
    }
  }, [post, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const postData: any = {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === "published" ? new Date() : null,
        aiMetadata: aiMetadata,
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
      const postData: any = {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        publishedAt: data.status === "published" && !post?.publishedAt ? new Date() : post?.publishedAt,
        aiMetadata: aiMetadata,
      };
      
      const response = await apiRequest("PUT", `/api/posts/${post!.id}`, postData);
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

  // AI action handlers
  const handleGenerateContent = async (topic: string, tone: string, length: string) => {
    try {
      const result = await generateContentMutation.mutateAsync({
        topic,
        tone: tone as any,
        length: length as any,
        platform: platforms.find(p => p.id === form.getValues("platformId"))?.name,
      });
      
      form.setValue("title", result.title || "");
      form.setValue("content", result.content);
      form.setValue("excerpt", result.excerpt || "");
      
      setAiMetadata({
        isAIGenerated: true,
        tone,
        generatedAt: new Date().toISOString(),
        originalPrompt: topic,
        modifications: [],
      });
      
      toast({
        title: "Content Generated",
        description: "AI has generated content based on your topic",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  const handleAdjustTone = async (targetTone: string) => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before adjusting tone",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await adjustToneMutation.mutateAsync({
        content,
        targetTone: targetTone as any,
      });
      
      form.setValue("content", result.content);
      
      setAiMetadata((prev: any) => ({
        ...prev,
        tone: targetTone,
        modifications: [
          ...(prev.modifications || []),
          {
            type: "tone-adjustment",
            timestamp: new Date().toISOString(),
            description: `Adjusted tone to ${targetTone}`,
          },
        ],
      }));
      
      toast({
        title: "Tone Adjusted",
        description: `Content tone adjusted to ${targetTone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust tone",
        variant: "destructive",
      });
    }
  };

  const handleCheckGrammar = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before checking grammar",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await checkGrammarMutation.mutateAsync({ content });
      setGrammarResult(result);
      
      if (result.hasIssues && result.correctedContent) {
        toast({
          title: "Grammar Issues Found",
          description: `Found ${result.issues.length} issues. Click to apply corrections.`,
        });
      } else {
        toast({
          title: "Grammar Check Complete",
          description: `Score: ${result.score}/100. No major issues found.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check grammar",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeEngagement = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before analyzing engagement",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeEngagementMutation.mutateAsync({
        content,
        platform: platforms.find(p => p.id === form.getValues("platformId"))?.name,
      });
      setEngagementResult(result);
      
      toast({
        title: "Engagement Analysis Complete",
        description: `Score: ${result.score}/100, Originality: ${result.originalityScore}/100`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze engagement",
        variant: "destructive",
      });
    }
  };

  const handleGenerateHeadlines = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before generating headlines",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateHeadlineMutation.mutateAsync({ content, count: 3 });
      setHeadlineSuggestions(result.headlines);
      
      toast({
        title: "Headlines Generated",
        description: "Click on a headline to use it",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate headlines",
        variant: "destructive",
      });
    }
  };

  const handleGenerateSummary = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before generating summary",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateSummaryMutation.mutateAsync({ content, maxLength: 200 });
      form.setValue("excerpt", result.summary);
      
      toast({
        title: "Summary Generated",
        description: "Summary has been added to the excerpt field",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCTA = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before generating CTAs",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateCTAMutation.mutateAsync({
        content,
        platform: platforms.find(p => p.id === form.getValues("platformId"))?.name,
        count: 2,
      });
      setCtaSuggestions(result.ctas);
      
      toast({
        title: "CTAs Generated",
        description: "Click on a CTA to insert it",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate CTAs",
        variant: "destructive",
      });
    }
  };

  const handleOptimizePost = async () => {
    const title = form.getValues("title");
    const content = form.getValues("content");
    
    if (!title || !content) {
      toast({
        title: "Incomplete",
        description: "Please add both title and content before optimizing",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await optimizePostMutation.mutateAsync({
        title,
        content,
        platform: platforms.find(p => p.id === form.getValues("platformId"))?.name,
        targetTone: aiMetadata.tone,
      });
      
      form.setValue("title", result.optimizedTitle);
      form.setValue("content", result.optimizedContent);
      
      setAiMetadata((prev: any) => ({
        ...prev,
        modifications: [
          ...(prev.modifications || []),
          {
            type: "optimization",
            timestamp: new Date().toISOString(),
            description: "Post optimized with AI",
          },
        ],
        qualityScores: result.qualityScores,
      }));
      
      toast({
        title: "Post Optimized",
        description: `Grammar: ${result.qualityScores.grammar}, Engagement: ${result.qualityScores.engagement}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize post",
        variant: "destructive",
      });
    }
  };

  const handleSuggestHashtags = async () => {
    const content = form.getValues("content");
    if (!content) {
      toast({
        title: "No Content",
        description: "Please add content before suggesting hashtags",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await suggestHashtagsMutation.mutateAsync({
        content,
        platform: platforms.find(p => p.id === form.getValues("platformId"))?.name,
        count: 5,
      });
      setSuggestedHashtags(result.hashtags);
      
      toast({
        title: "Hashtags Suggested",
        description: "Click on a hashtag to insert it",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suggest hashtags",
        variant: "destructive",
      });
    }
  };

  const insertHashtag = (hashtag: string) => {
    const currentContent = form.getValues("content");
    form.setValue("content", `${currentContent}\n\n${hashtag}`);
  };

  const insertCTA = (cta: string) => {
    const currentContent = form.getValues("content");
    form.setValue("content", `${currentContent}\n\n${cta}`);
  };

  const applyHeadline = (headline: string) => {
    form.setValue("title", headline);
    toast({
      title: "Headline Applied",
      description: "The headline has been set as the title",
    });
  };

  const applyGrammarFix = () => {
    if (grammarResult?.correctedContent) {
      form.setValue("content", grammarResult.correctedContent);
      setGrammarResult(null);
      toast({
        title: "Grammar Fixes Applied",
        description: "Content has been corrected",
      });
    }
  };

  const isAILoading = 
    generateContentMutation.isPending ||
    adjustToneMutation.isPending ||
    checkGrammarMutation.isPending ||
    analyzeEngagementMutation.isPending ||
    generateHeadlineMutation.isPending ||
    generateSummaryMutation.isPending ||
    generateCTAMutation.isPending ||
    optimizePostMutation.isPending ||
    suggestHashtagsMutation.isPending;

  if (!aiStatus?.enabled) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Post" : "Create New Post"}</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            AI features are currently disabled. The AI-powered post composer requires AI features to be enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-xtab-blue" />
            {isEditing ? "Edit Post with AI" : "AI-Powered Post Composer"}
          </DialogTitle>
          {aiMetadata.isAIGenerated && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Generated
            </Badge>
          )}
        </div>
      </DialogHeader>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="enhance">Enhance</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="platformId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            {platform.name}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter post title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {headlineSuggestions.length > 0 && (
                <Card className="border-xtab-blue/20 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Suggested Headlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {headlineSuggestions.map((headline, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => applyHeadline(headline)}
                      >
                        {headline}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your post content..."
                        className="min-h-[200px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {grammarResult && grammarResult.hasIssues && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Grammar Issues Found (Score: {grammarResult.score}/100)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ScrollArea className="h-[100px]">
                      {grammarResult.issues.map((issue: any, index: number) => (
                        <div key={index} className="text-sm mb-2">
                          <span className="font-medium">{issue.type}:</span> {issue.message}
                        </div>
                      ))}
                    </ScrollArea>
                    {grammarResult.correctedContent && (
                      <Button
                        onClick={applyGrammarFix}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Apply Corrections
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {ctaSuggestions.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Call-to-Action Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ctaSuggestions.map((cta, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => insertCTA(cta)}
                      >
                        {cta}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief summary..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {suggestedHashtags.length > 0 && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Suggested Hashtags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {suggestedHashtags.map((hashtag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-100"
                          onClick={() => insertHashtag(hashtag)}
                        >
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

                <FormField
                  control={form.control}
                  name="scheduledFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule For (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="xtab-gradient"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Post"
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="enhance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Enhancement Tools</CardTitle>
              <CardDescription>
                Use AI to enhance your post with powerful tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateHeadlines}
                  disabled={isAILoading}
                  className="h-auto py-3 flex flex-col items-start"
                >
                  <Lightbulb className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">Generate Headlines</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isAILoading}
                  className="h-auto py-3 flex flex-col items-start"
                >
                  <MessageSquare className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">Generate Summary</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCTA}
                  disabled={isAILoading}
                  className="h-auto py-3 flex flex-col items-start"
                >
                  <Zap className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">Generate CTA</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestHashtags}
                  disabled={isAILoading}
                  className="h-auto py-3 flex flex-col items-start"
                >
                  <Hash className="h-4 w-4 mb-1" />
                  <span className="text-xs font-medium">Suggest Hashtags</span>
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Adjust Tone</h4>
                <div className="grid grid-cols-3 gap-2">
                  {["professional", "casual", "friendly", "formal", "humorous"].map((tone) => (
                    <Button
                      key={tone}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdjustTone(tone)}
                      disabled={isAILoading}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleOptimizePost}
                disabled={isAILoading}
                className="w-full xtab-gradient"
                size="lg"
              >
                {isAILoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Optimize Post with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis Tools</CardTitle>
              <CardDescription>
                Check quality and engagement potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCheckGrammar}
                  disabled={isAILoading}
                  className="h-auto py-4 flex flex-col items-center"
                >
                  <CheckCircle2 className="h-5 w-5 mb-2" />
                  <span className="text-sm font-medium">Check Grammar</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleAnalyzeEngagement}
                  disabled={isAILoading}
                  className="h-auto py-4 flex flex-col items-center"
                >
                  <TrendingUp className="h-5 w-5 mb-2" />
                  <span className="text-sm font-medium">Analyze Engagement</span>
                </Button>
              </div>

              {grammarResult && !grammarResult.hasIssues && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Grammar Score: {grammarResult.score}/100</p>
                        <p className="text-xs text-muted-foreground">No major issues found!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {engagementResult && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Engagement Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Engagement Score</p>
                        <p className="text-2xl font-bold text-xtab-blue">{engagementResult.score}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Originality Score</p>
                        <p className="text-2xl font-bold text-xtab-emerald">{engagementResult.originalityScore}/100</p>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium mb-2">Assessment</p>
                      <p className="text-sm text-muted-foreground">{engagementResult.overallAssessment}</p>
                    </div>
                    {engagementResult.factors && engagementResult.factors.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-medium mb-2">Key Factors</p>
                          <ScrollArea className="h-[150px]">
                            <div className="space-y-2">
                              {engagementResult.factors.map((factor: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">{factor.factor}:</span>{" "}
                                  <span className="text-muted-foreground">{factor.suggestion}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {aiMetadata.qualityScores && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quality Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Grammar</p>
                        <p className="text-xl font-bold">{aiMetadata.qualityScores.grammar}/100</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-xl font-bold">{aiMetadata.qualityScores.engagement}/100</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Originality</p>
                        <p className="text-xl font-bold">{aiMetadata.qualityScores.originality}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
