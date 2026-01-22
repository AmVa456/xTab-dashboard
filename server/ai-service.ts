/**
 * AI Service Module
 * Integrates with Google Gemini API and OpenAI DALL-E for AI-powered features
 * 
 * Note: Content filtering is disabled to allow maximum creative freedom.
 * All safety settings are set to BLOCK_NONE for unfiltered AI responses.
 */

import { z } from "zod";
import OpenAI from "openai";
import { cacheService } from "./cache-service";

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_FEATURES_ENABLED = process.env.AI_FEATURES_ENABLED === "true";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Validation schemas
export const generateContentSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  platform: z.string().optional(),
  tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
});

export const generateImageSchema = z.object({
  description: z.string().min(1, "Description is required"),
  style: z.string().optional(),
});

export const suggestHashtagsSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platform: z.string().optional(),
  count: z.number().min(1).max(20).optional().default(5),
  includeTrending: z.boolean().optional().default(true),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.string().optional(),
});

export type GenerateContentRequest = z.infer<typeof generateContentSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageSchema>;
export type SuggestHashtagsRequest = z.infer<typeof suggestHashtagsSchema>;
export type ChatRequest = z.infer<typeof chatSchema>;

/**
 * Check if AI features are enabled and configured
 */
export function isAIEnabled(): boolean {
  return AI_FEATURES_ENABLED && !!GEMINI_API_KEY;
}

/**
 * Call Gemini API with a prompt
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Invalid response format from Gemini API");
    }

    return text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
}

/**
 * Generate content suggestions based on topic and parameters
 */
export async function generateContent(request: GenerateContentRequest): Promise<{
  content: string;
  title?: string;
  excerpt?: string;
}> {
  const { topic, platform, tone = "professional", length = "medium" } = request;

  // Check cache first
  const cached = await cacheService.get<{ content: string; title?: string; excerpt?: string }>(
    "generate-content",
    { topic, platform, tone, length }
  );
  
  if (cached) {
    return cached;
  }

  const lengthMap = {
    short: "50-100 words",
    medium: "150-300 words",
    long: "400-600 words",
  };

  const prompt = `You are a professional social media content writer. 
Generate a ${tone} ${lengthMap[length]} post about "${topic}"${platform ? ` for ${platform}` : ""}.

Provide:
1. A catchy title (max 100 characters)
2. A brief excerpt (max 200 characters)
3. The main content body

Format your response as JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}`;

  const response = await callGeminiAPI(prompt);
  
  let result: { content: string; title?: string; excerpt?: string };
  
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        title: parsed.title || "",
        excerpt: parsed.excerpt || "",
        content: parsed.content || response,
      };
    } else {
      result = { content: response };
    }
  } catch (e) {
    // Fallback: return raw response as content
    result = { content: response };
  }

  // Cache the result for 1 hour
  await cacheService.set("generate-content", { topic, platform, tone, length }, result, 3600);

  return result;
}

/**
 * Generate image using DALL-E or fallback to prompt generation
 */
export async function generateImage(request: GenerateImageRequest): Promise<{
  description: string;
  prompt: string;
  imageUrl?: string;
}> {
  const { description, style = "modern and professional" } = request;

  // Check cache first
  const cached = await cacheService.get<{ description: string; prompt: string; imageUrl?: string }>(
    "generate-image",
    { description, style }
  );
  
  if (cached) {
    return cached;
  }

  // Generate image prompt using Gemini
  const promptText = `Generate a detailed image prompt for an AI image generator based on this description: "${description}". 
The style should be: ${style}.

Provide a detailed, descriptive prompt that would work well with image generation AI tools like DALL-E or Midjourney.
Keep it concise but descriptive (100-200 words).`;

  const imagePrompt = await callGeminiAPI(promptText);

  let result: { description: string; prompt: string; imageUrl?: string };

  // Try to use DALL-E if configured
  if (openai && OPENAI_API_KEY) {
    try {
      console.log("Generating image with DALL-E...");
      const dalleResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = dalleResponse.data?.[0]?.url;
      
      result = {
        description,
        prompt: imagePrompt,
        imageUrl: imageUrl || `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(description.slice(0, 50))}`,
      };
      
      console.log("DALL-E image generated successfully");
    } catch (error) {
      console.error("DALL-E generation failed, using placeholder:", error);
      result = {
        description,
        prompt: imagePrompt,
        imageUrl: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(description.slice(0, 50))}`,
      };
    }
  } else {
    // Fallback to placeholder if DALL-E not configured
    console.log("DALL-E not configured, using placeholder image");
    result = {
      description,
      prompt: imagePrompt,
      imageUrl: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(description.slice(0, 50))}`,
    };
  }

  // Cache the result for 24 hours (images are expensive)
  await cacheService.set("generate-image", { description, style }, result, 86400);

  return result;
}

/**
 * Suggest relevant hashtags for content with enhanced intelligence
 * 
 * This function uses AI to analyze content and suggest:
 * - Contextually relevant hashtags based on content topic and keywords
 * - Trending hashtags from platform-specific patterns
 * - Mix of broad reach and niche hashtags for optimal engagement
 * 
 * Logic:
 * 1. Content Analysis: Extract key topics, themes, and entities
 * 2. Platform Optimization: Tailor suggestions to platform best practices
 * 3. Trending Detection: Identify currently popular hashtags in the niche
 * 4. Balance: Mix high-volume and targeted hashtags (30-70 rule)
 * 5. Relevance Scoring: Rank hashtags by contextual fit
 */
export async function suggestHashtags(request: SuggestHashtagsRequest): Promise<{
  hashtags: Array<{
    tag: string;
    relevanceScore: number;
    trending: boolean;
    category: string;
  }>;
}> {
  const { content, platform, count = 5, includeTrending = true } = request;

  // Check cache first
  const cached = await cacheService.get<{
    hashtags: Array<{
      tag: string;
      relevanceScore: number;
      trending: boolean;
      category: string;
    }>;
  }>(
    "suggest-hashtags",
    { content: content.slice(0, 200), platform, count, includeTrending }
  );
  
  if (cached) {
    return cached;
  }

  // Enhanced prompt for better hashtag intelligence
  const prompt = `You are an expert social media strategist. Analyze this post and suggest ${count} strategic hashtags${platform ? ` optimized for ${platform}` : ""}.

Post content: "${content.slice(0, 500)}"

Provide hashtags in JSON format with the following structure:
{
  "hashtags": [
    {
      "tag": "hashtag_without_#",
      "relevanceScore": 0.95,
      "trending": true,
      "category": "primary"
    }
  ]
}

Guidelines:
- relevanceScore: 0.0-1.0 (how relevant to content)
- trending: true if currently popular, false otherwise
- category: "primary" (main topic), "secondary" (related topic), or "broad" (general reach)
- Balance: Include mix of trending (high reach) and niche (targeted) hashtags
${platform === 'Twitter' ? '- Twitter: Max 2-3 hashtags, focus on trending topics' : ''}
${platform === 'LinkedIn' ? '- LinkedIn: 3-5 professional hashtags, industry-specific' : ''}
${platform === 'Instagram' ? '- Instagram: Use full 30 if available, mix popular and niche' : ''}
${platform === 'Reddit' ? '- Reddit: Minimal hashtags, focus on subreddit relevance' : ''}

Focus on:
1. Content relevance (most important)
2. Current trending status${includeTrending ? ' (prioritize trending hashtags)' : ''}
3. Platform best practices
4. Engagement potential
5. Target audience alignment`;

  const response = await callGeminiAPI(prompt);
  
  let result: {
    hashtags: Array<{
      tag: string;
      relevanceScore: number;
      trending: boolean;
      category: string;
    }>;
  };
  
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        hashtags: (parsed.hashtags || [])
          .map((h: any) => ({
            tag: `#${h.tag.replace(/^#/, '')}`,
            relevanceScore: h.relevanceScore || 0.5,
            trending: h.trending || false,
            category: h.category || 'secondary',
          }))
          .slice(0, count),
      };
    } else {
      // Fallback: parse plain text hashtags
      const hashtags = response
        .split("\n")
        .map(line => line.trim().replace(/^#/, ''))
        .filter(tag => tag.length > 0 && tag.length < 50)
        .slice(0, count);

      result = {
        hashtags: hashtags.map((tag, index) => ({
          tag: `#${tag}`,
          relevanceScore: 0.7 - (index * 0.1),
          trending: index < Math.ceil(count / 3), // First third are marked trending
          category: index === 0 ? 'primary' : index < count / 2 ? 'secondary' : 'broad',
        })),
      };
    }
  } catch (e) {
    console.error("Failed to parse hashtag response:", e);
    // Fallback with generic hashtags
    result = {
      hashtags: [
        { tag: '#socialmedia', relevanceScore: 0.6, trending: true, category: 'broad' },
        { tag: '#content', relevanceScore: 0.5, trending: false, category: 'broad' },
      ].slice(0, count),
    };
  }

  // Cache for 6 hours
  await cacheService.set(
    "suggest-hashtags",
    { content: content.slice(0, 200), platform, count, includeTrending },
    result,
    21600
  );

  return result;
}

/**
 * AI Chat assistant for content ideas and optimization
 */
export async function chat(request: ChatRequest): Promise<{
  response: string;
  suggestions?: string[];
}> {
  const { message, context } = request;

  // Check cache for common questions (cache by message only, not context)
  const cached = await cacheService.get<{ response: string; suggestions?: string[] }>(
    "chat",
    { message }
  );
  
  if (cached && !context) { // Only use cache if no specific context
    return cached;
  }

  const systemContext = context 
    ? `\n\nContext: ${context}`
    : "";

  const prompt = `You are a helpful AI assistant for social media content creation and management. 
Help users with content ideas, writing tips, best practices, and optimization suggestions.${systemContext}

User message: "${message}"

Provide a helpful, actionable response. If relevant, include 2-3 specific suggestions or tips.`;

  const response = await callGeminiAPI(prompt);

  // Try to extract suggestions if present
  const suggestions: string[] = [];
  const bulletPoints = response.match(/[-•*]\s*(.+)/g);
  if (bulletPoints && bulletPoints.length > 0) {
    bulletPoints.slice(0, 3).forEach(point => {
      const cleaned = point.replace(/^[-•*]\s*/, "").trim();
      if (cleaned) suggestions.push(cleaned);
    });
  }

  const result = {
    response,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };

  // Cache common questions for 12 hours (only if no context)
  if (!context) {
    await cacheService.set("chat", { message }, result, 43200);
  }

  return result;
}
