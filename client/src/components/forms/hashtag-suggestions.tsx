/**
 * Enhanced Hashtag Suggestions Component
 * Features:
 * - AI-generated hashtag suggestions with relevance scores
 * - Visual markers for AI vs user hashtags
 * - One-click copy to clipboard
 * - Real-time updates based on content changes
 * - Trending indicators
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Copy, 
  TrendingUp, 
  Check, 
  X, 
  Loader2,
  User,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Hashtag {
  tag: string;
  relevanceScore: number;
  trending: boolean;
  category: 'primary' | 'secondary' | 'broad';
  isAIGenerated?: boolean;
  selected?: boolean;
}

interface HashtagSuggestionsProps {
  hashtags: Hashtag[];
  onHashtagClick: (hashtag: string) => void;
  onHashtagSelect?: (hashtag: string, selected: boolean) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export default function HashtagSuggestions({
  hashtags,
  onHashtagClick,
  onHashtagSelect,
  onDismiss,
  isLoading = false,
}: HashtagSuggestionsProps) {
  const { toast } = useToast();
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize selected tags from props
    const selected = new Set(
      hashtags.filter(h => h.selected).map(h => h.tag)
    );
    setSelectedTags(selected);
  }, [hashtags]);

  const copyToClipboard = async (hashtag: string) => {
    try {
      await navigator.clipboard.writeText(hashtag);
      setCopiedHashtag(hashtag);
      toast({
        title: "Copied!",
        description: `${hashtag} copied to clipboard`,
      });
      setTimeout(() => setCopiedHashtag(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy hashtag to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyAllHashtags = async () => {
    const allTags = hashtags.map(h => h.tag).join(" ");
    try {
      await navigator.clipboard.writeText(allTags);
      toast({
        title: "All hashtags copied!",
        description: `${hashtags.length} hashtags copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy hashtags to clipboard",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (hashtag: string) => {
    const newSelected = new Set(selectedTags);
    const isSelected = newSelected.has(hashtag);
    
    if (isSelected) {
      newSelected.delete(hashtag);
    } else {
      newSelected.add(hashtag);
    }
    
    setSelectedTags(newSelected);
    
    if (onHashtagSelect) {
      onHashtagSelect(hashtag, !isSelected);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "primary":
        return "bg-xtab-pink text-white";
      case "secondary":
        return "bg-xtab-pink-light text-white";
      case "broad":
        return "bg-xtab-emerald text-white";
      default:
        return "bg-secondary";
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-blue-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border border-dashed">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Generating intelligent hashtag suggestions...
        </span>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-xtab-pink" />
          <span className="text-sm font-semibold">AI Hashtag Suggestions</span>
          <Badge variant="secondary" className="text-xs">
            {hashtags.length} suggested
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyAllHashtags}
                  className="h-8 gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy all hashtags to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hashtag Grid */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map((hashtag, index) => {
          const isSelected = selectedTags.has(hashtag.tag);
          const isCopied = copiedHashtag === hashtag.tag;
          const isAI = hashtag.isAIGenerated !== false;

          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative group">
                    <Badge
                      className={cn(
                        "cursor-pointer transition-all duration-200 gap-1.5 pr-8",
                        isSelected
                          ? getCategoryColor(hashtag.category)
                          : "bg-background hover:bg-muted border-2",
                        "hover:scale-105"
                      )}
                      onClick={() => onHashtagClick(hashtag.tag)}
                    >
                      {/* AI/User Indicator */}
                      {isAI ? (
                        <Sparkles className="h-3 w-3 opacity-70" />
                      ) : (
                        <User className="h-3 w-3 opacity-70" />
                      )}
                      
                      <span className="font-medium">{hashtag.tag}</span>
                      
                      {/* Trending Badge */}
                      {hashtag.trending && (
                        <TrendingUp className="h-3 w-3 text-orange-500" />
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(hashtag.tag);
                          }}
                          className={cn(
                            "p-0.5 rounded hover:bg-background/50 transition-colors",
                            isSelected && "bg-background/30"
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <BarChart3 className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(hashtag.tag);
                          }}
                          className="p-0.5 rounded hover:bg-background/50 transition-colors"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      </div>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{hashtag.tag}</span>
                      {hashtag.trending && (
                        <Badge variant="secondary" className="text-xs">
                          Trending
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Relevance:</span>
                        <span className={cn("font-semibold", getRelevanceColor(hashtag.relevanceScore))}>
                          {(hashtag.relevanceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>Category: {hashtag.category}</div>
                      <div className="flex items-center gap-1">
                        {isAI ? (
                          <>
                            <Sparkles className="h-3 w-3" />
                            <span>AI Generated</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" />
                            <span>User Added</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Generated</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-orange-500" />
            <span>Trending</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>User Added</span>
          </div>
        </div>
        <span className="italic">Click hashtag to add to content</span>
      </div>
    </div>
  );
}
