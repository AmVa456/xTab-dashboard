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
}

export interface SuggestHashtagsResponse {
  hashtags: string[];
  trending?: boolean[];
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
 * Hook to adjust tone of content
 */
export function useAdjustTone() {
  return useMutation<
    { content: string; originalTone?: string },
    Error,
    { content: string; targetTone: "professional" | "casual" | "friendly" | "formal" | "humorous" }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/adjust-tone", data);
      return response.json();
    },
  });
}

/**
 * Hook to check grammar
 */
export function useCheckGrammar() {
  return useMutation<
    {
      hasIssues: boolean;
      issues: Array<{ type: string; message: string; suggestion: string }>;
      correctedContent?: string;
      score: number;
    },
    Error,
    { content: string }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/check-grammar", data);
      return response.json();
    },
  });
}

/**
 * Hook to analyze engagement potential
 */
export function useAnalyzeEngagement() {
  return useMutation<
    {
      score: number;
      factors: Array<{ factor: string; impact: string; suggestion: string }>;
      overallAssessment: string;
      originalityScore: number;
    },
    Error,
    { content: string; platform?: string }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/analyze-engagement", data);
      return response.json();
    },
  });
}

/**
 * Hook to generate headlines
 */
export function useGenerateHeadline() {
  return useMutation<
    { headlines: string[] },
    Error,
    { content: string; count?: number }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-headline", data);
      return response.json();
    },
  });
}

/**
 * Hook to generate summary
 */
export function useGenerateSummary() {
  return useMutation<
    { summary: string },
    Error,
    { content: string; maxLength?: number }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-summary", data);
      return response.json();
    },
  });
}

/**
 * Hook to generate call-to-action
 */
export function useGenerateCTA() {
  return useMutation<
    { ctas: string[] },
    Error,
    { content: string; platform?: string; count?: number }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/generate-cta", data);
      return response.json();
    },
  });
}

/**
 * Hook to optimize post
 */
export function useOptimizePost() {
  return useMutation<
    {
      optimizedTitle: string;
      optimizedContent: string;
      suggestions: string[];
      improvements: Array<{ area: string; change: string }>;
      qualityScores: {
        grammar: number;
        engagement: number;
        originality: number;
      };
    },
    Error,
    {
      title: string;
      content: string;
      platform?: string;
      targetTone?: "professional" | "casual" | "friendly" | "formal" | "humorous";
    }
  >({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/ai/optimize-post", data);
      return response.json();
    },
  });
}
