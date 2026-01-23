/**
 * Trending Hashtags Widget
 * Displays trending hashtags with analytics and quick-add functionality
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrendingHashtags, useHashtagAnalytics } from "@/hooks/use-ai";
import { TrendingUp, Copy, BarChart3, Loader2, Hash, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrendingHashtagsProps {
  platform?: string;
}

export default function TrendingHashtags({ platform }: TrendingHashtagsProps) {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState(platform || "all");
  
  const { data: trendingData, isLoading: trendingLoading } = useTrendingHashtags(
    selectedPlatform === "all" ? undefined : selectedPlatform,
    10
  );

  const { data: analyticsData, isLoading: analyticsLoading } = useHashtagAnalytics(
    selectedPlatform === "all" ? undefined : selectedPlatform,
    10
  );

  const copyHashtag = async (hashtag: string) => {
    try {
      await navigator.clipboard.writeText(hashtag);
      toast({
        title: "Copied!",
        description: `${hashtag} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy hashtag",
        variant: "destructive",
      });
    }
  };

  const copyAllTrending = async () => {
    if (!trendingData?.hashtags) return;
    
    try {
      await navigator.clipboard.writeText(trendingData.hashtags.join(" "));
      toast({
        title: "All hashtags copied!",
        description: `${trendingData.hashtags.length} trending hashtags copied`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy hashtags",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-xtab-pink" />
            <CardTitle className="text-lg">Trending Hashtags</CardTitle>
          </div>
          {trendingData?.hashtags && trendingData.hashtags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAllTrending}
              className="h-8 gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy All
            </Button>
          )}
        </div>
        <CardDescription>
          AI-powered trending hashtag recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Twitter">Twitter</TabsTrigger>
            <TabsTrigger value="LinkedIn">LinkedIn</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPlatform} className="space-y-4">
            {/* Trending Hashtags Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>Most Selected</span>
              </div>

              {trendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : trendingData?.hashtags && trendingData.hashtags.length > 0 ? (
                <div className="space-y-2">
                  {trendingData.hashtags.map((hashtag, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          #{index + 1}
                        </Badge>
                        <span className="font-medium text-sm">{hashtag}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyHashtag(hashtag)}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No trending hashtags yet</p>
                  <p className="text-xs mt-1">Start using hashtags to see trends</p>
                </div>
              )}
            </div>

            {/* Analytics Section */}
            {analyticsData?.analytics && analyticsData.analytics.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 text-xtab-pink-light" />
                  <span>Performance Analytics</span>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analyticsData.analytics.slice(0, 5).map((item, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-medium text-sm truncate">
                                  {item.hashtag}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.selectionRate.toFixed(0)}%
                                </Badge>
                                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-xtab-pink rounded-full transition-all"
                                    style={{ width: `${item.selectionRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <div className="font-semibold">{item.hashtag}</div>
                              <div>Suggested: {item.totalSuggestions} times</div>
                              <div>Selected: {item.totalSelections} times</div>
                              <div>Selection Rate: {item.selectionRate.toFixed(1)}%</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Indicator */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-xtab-pink" />
            <span>Powered by AI Intelligence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
