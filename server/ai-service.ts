/**
 * AI Service Module
 * Integrates with Google Gemini API for AI-powered features
 */

import { z } from "zod";

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const AI_FEATURES_ENABLED = process.env.AI_FEATURES_ENABLED === "true";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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
        }]
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
  
  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || "",
        excerpt: parsed.excerpt || "",
        content: parsed.content || response,
      };
    }
  } catch (e) {
    // Fallback: return raw response as content
  }

  return {
    content: response,
  };
}

/**
 * Generate image description/concept for AI image generation
 */
export async function generateImage(request: GenerateImageRequest): Promise<{
  description: string;
  prompt: string;
  imageUrl?: string;
}> {
  const { description, style = "modern and professional" } = request;

  const prompt = `Generate a detailed image prompt for an AI image generator based on this description: "${description}". 
The style should be: ${style}.

Provide a detailed, descriptive prompt that would work well with image generation AI tools like DALL-E or Midjourney.
Keep it concise but descriptive (100-200 words).`;

  const imagePrompt = await callGeminiAPI(prompt);

  return {
    description,
    prompt: imagePrompt,
    // Note: Actual image generation would require DALL-E or similar API
    // For now, we return a placeholder
    imageUrl: `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(description.slice(0, 50))}`,
  };
}

/**
 * Suggest relevant hashtags for content
 */
export async function suggestHashtags(request: SuggestHashtagsRequest): Promise<{
  hashtags: string[];
  trending?: boolean[];
}> {
  const { content, platform, count = 5 } = request;

  const prompt = `Analyze this social media post and suggest ${count} relevant, popular hashtags${platform ? ` for ${platform}` : ""}.

Post content: "${content.slice(0, 500)}"

Provide only the hashtags, one per line, without the # symbol. Focus on:
- Relevance to the content
- Popular and trending hashtags
- Platform-specific best practices${platform ? ` for ${platform}` : ""}

Example format:
socialmedia
digitalmarketing
contentcreation`;

  const response = await callGeminiAPI(prompt);
  
  // Parse hashtags from response
  const hashtags = response
    .split("\n")
    .map(line => line.trim().replace(/^#/, ""))
    .filter(tag => tag.length > 0 && tag.length < 50)
    .slice(0, count);

  return {
    hashtags: hashtags.map(tag => `#${tag}`),
  };
}

/**
 * AI Chat assistant for content ideas and optimization
 */
export async function chat(request: ChatRequest): Promise<{
  response: string;
  suggestions?: string[];
}> {
  const { message, context } = request;

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

  return {
    response,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}
