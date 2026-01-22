/**
 * Custom React hooks for AI features
 * Uses React Query for state management and API calls
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Types
export interface GenerateContentRequest {
  topic: string;
  platform?: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
}

export interface GenerateContentResponse {
  content: string;
  title?: string;
  excerpt?: string;
}

export interface GenerateImageRequest {
  description: string;
  style?: string;
}

export interface GenerateImageResponse {
  description: string;
  prompt: string;
  imageUrl?: string;
}

export interface SuggestHashtagsRequest {
  content: string;
  platform?: string;
  count?: number;
  includeTrending?: boolean;
}

export interface SuggestHashtagsResponse {
  hashtags: Array<{
    tag: string;
    relevanceScore: number;
    trending: boolean;
    category: 'primary' | 'secondary' | 'broad';
  }>;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
}

export interface AIStatusResponse {
  enabled: boolean;
  message: string;
}

/**
 * Hook to check if AI features are enabled
 */
export function useAIStatus() {
  return useQuery<AIStatusResponse>({
    queryKey: ["/api/ai/status"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to generate content using AI
 */
export function useGenerateContent() {
  return useMutation<GenerateContentResponse, Error, GenerateContentRequest>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-content", data);
      return response.json();
    },
  });
}

/**
 * Hook to generate image concepts using AI
 */
export function useGenerateImage() {
  return useMutation<GenerateImageResponse, Error, GenerateImageRequest>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-image", data);
      return response.json();
    },
  });
}

/**
 * Hook to suggest hashtags using AI
 */
export function useSuggestHashtags() {
  return useMutation<SuggestHashtagsResponse, Error, SuggestHashtagsRequest>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/suggest-hashtags", data);
      return response.json();
    },
  });
}

/**
 * Hook to chat with AI assistant
 */
export function useAIChat() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/chat", data);
      return response.json();
    },
  });
}

/**
 * Hook to save hashtag suggestions to MongoDB
 */
export function useSaveHashtagSuggestions() {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/hashtags/suggestions", data);
      return response.json();
    },
  });
}

/**
 * Hook to get hashtag suggestions for a post
 */
export function useHashtagSuggestions(postId?: string) {
  return useQuery({
    queryKey: ["/api/hashtags/suggestions", postId],
    queryFn: async () => {
      if (!postId) return null;
      const response = await apiRequest("GET", `/api/hashtags/suggestions/${postId}`);
      return response.json();
    },
    enabled: !!postId,
  });
}

/**
 * Hook to update hashtag selection
 */
export function useUpdateHashtagSelection() {
  return useMutation({
    mutationFn: async ({ suggestionId, hashtag, selected }: { 
      suggestionId: string; 
      hashtag: string; 
      selected: boolean;
    }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/hashtags/suggestions/${suggestionId}/select`,
        { hashtag, selected }
      );
      return response.json();
    },
  });
}

/**
 * Hook to get trending hashtags
 */
export function useTrendingHashtags(platform?: string, limit?: number) {
  return useQuery({
    queryKey: ["/api/hashtags/trending", platform, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.append('platform', platform);
      if (limit) params.append('limit', limit.toString());
      
      const url = `/api/hashtags/trending${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to get hashtag analytics
 */
export function useHashtagAnalytics(platform?: string, limit?: number) {
  return useQuery({
    queryKey: ["/api/hashtags/analytics", platform, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.append('platform', platform);
      if (limit) params.append('limit', limit.toString());
      
      const url = `/api/hashtags/analytics${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
