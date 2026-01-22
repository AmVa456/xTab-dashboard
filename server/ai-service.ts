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

// Constants
const DEFAULT_TONE = "neutral";
const DEFAULT_GRAMMAR_SCORE = 85;
const DEFAULT_ENGAGEMENT_SCORE = 75;
const DEFAULT_ORIGINALITY_SCORE = 80;
const MAX_HEADLINE_LENGTH = 150;
const SUMMARY_LENGTH_BUFFER = 50;

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
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.string().optional(),
});

export const adjustToneSchema = z.object({
  content: z.string().min(1, "Content is required"),
  targetTone: z.enum(["professional", "casual", "friendly", "formal", "humorous"]),
});

export const checkGrammarSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export const analyzeEngagementSchema = z.object({
  content: z.string().min(1, "Content is required"),
  platform: z.string().optional(),
});

export const generateHeadlineSchema = z.object({
  content: z.string().min(1, "Content is required"),
  count: z.number().min(1).max(5).optional().default(3),
});

export const generateSummarySchema = z.object({
  content: z.string().min(1, "Content is required"),
  maxLength: z.number().optional().default(200),
});

export const generateCTASchema = z.object({
  content: z.string().min(1, "Content is required"),
  platform: z.string().optional(),
  count: z.number().min(1).max(3).optional().default(2),
});

export const optimizePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  platform: z.string().optional(),
  targetTone: z.enum(["professional", "casual", "friendly", "formal", "humorous"]).optional(),
});

export type GenerateContentRequest = z.infer<typeof generateContentSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageSchema>;
export type SuggestHashtagsRequest = z.infer<typeof suggestHashtagsSchema>;
export type ChatRequest = z.infer<typeof chatSchema>;
export type AdjustToneRequest = z.infer<typeof adjustToneSchema>;
export type CheckGrammarRequest = z.infer<typeof checkGrammarSchema>;
export type AnalyzeEngagementRequest = z.infer<typeof analyzeEngagementSchema>;
export type GenerateHeadlineRequest = z.infer<typeof generateHeadlineSchema>;
export type GenerateSummaryRequest = z.infer<typeof generateSummarySchema>;
export type GenerateCTARequest = z.infer<typeof generateCTASchema>;
export type OptimizePostRequest = z.infer<typeof optimizePostSchema>;

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
 * Suggest relevant hashtags for content
 */
export async function suggestHashtags(request: SuggestHashtagsRequest): Promise<{
  hashtags: string[];
  trending?: boolean[];
}> {
  const { content, platform, count = 5 } = request;

  // Check cache first
  const cached = await cacheService.get<{ hashtags: string[]; trending?: boolean[] }>(
    "suggest-hashtags",
    { content: content.slice(0, 200), platform, count } // Cache by content snippet to avoid huge keys
  );
  
  if (cached) {
    return cached;
  }

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

  const result = {
    hashtags: hashtags.map(tag => `#${tag}`),
  };

  // Cache for 6 hours
  await cacheService.set("suggest-hashtags", { content: content.slice(0, 200), platform, count }, result, 21600);

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

/**
 * Adjust tone of content
 */
export async function adjustTone(request: AdjustToneRequest): Promise<{
  content: string;
  originalTone?: string;
}> {
  const { content, targetTone } = request;

  // Check cache first
  const cached = await cacheService.get<{ content: string; originalTone?: string }>(
    "adjust-tone",
    { content: content.slice(0, 200), targetTone }
  );
  
  if (cached) {
    return cached;
  }

  const toneDescriptions = {
    professional: "formal, business-like, and authoritative",
    casual: "relaxed, informal, and conversational",
    friendly: "warm, approachable, and personable",
    formal: "respectful, structured, and traditional",
    humorous: "witty, entertaining, and lighthearted",
  };

  const prompt = `Rewrite the following text to have a ${toneDescriptions[targetTone]} tone while preserving the core message and key information.

Original text:
"${content}"

Provide only the rewritten text without any explanations or prefixes.`;

  const adjustedContent = await callGeminiAPI(prompt);

  const result = {
    content: adjustedContent.trim(),
    originalTone: DEFAULT_TONE,
  };

  // Cache for 6 hours
  await cacheService.set("adjust-tone", { content: content.slice(0, 200), targetTone }, result, 21600);

  return result;
}

/**
 * Check grammar and provide corrections
 */
export async function checkGrammar(request: CheckGrammarRequest): Promise<{
  hasIssues: boolean;
  issues: Array<{ type: string; message: string; suggestion: string }>;
  correctedContent?: string;
  score: number;
}> {
  const { content } = request;

  // Check cache first
  const cached = await cacheService.get<{
    hasIssues: boolean;
    issues: Array<{ type: string; message: string; suggestion: string }>;
    correctedContent?: string;
    score: number;
  }>(
    "check-grammar",
    { content: content.slice(0, 500) }
  );
  
  if (cached) {
    return cached;
  }

  const prompt = `Analyze the following text for grammar, spelling, and style issues. Provide your response in JSON format with the following structure:
{
  "hasIssues": boolean,
  "issues": [
    {
      "type": "grammar|spelling|style",
      "message": "description of the issue",
      "suggestion": "suggested correction"
    }
  ],
  "correctedContent": "the fully corrected text",
  "score": number between 0-100 indicating grammar quality
}

Text to analyze:
"${content}"`;

  const response = await callGeminiAPI(prompt);

  let result: {
    hasIssues: boolean;
    issues: Array<{ type: string; message: string; suggestion: string }>;
    correctedContent?: string;
    score: number;
  };

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        hasIssues: parsed.hasIssues || false,
        issues: parsed.issues || [],
        correctedContent: parsed.correctedContent,
        score: parsed.score || DEFAULT_GRAMMAR_SCORE,
      };
    } else {
      result = {
        hasIssues: false,
        issues: [],
        score: 90,
      };
    }
  } catch (e) {
    result = {
      hasIssues: false,
      issues: [],
      score: DEFAULT_GRAMMAR_SCORE,
    };
  }

  // Cache for 12 hours
  await cacheService.set("check-grammar", { content: content.slice(0, 500) }, result, 43200);

  return result;
}

/**
 * Analyze engagement potential
 */
export async function analyzeEngagement(request: AnalyzeEngagementRequest): Promise<{
  score: number;
  factors: Array<{ factor: string; impact: string; suggestion: string }>;
  overallAssessment: string;
  originalityScore: number;
}> {
  const { content, platform } = request;

  // Check cache first
  const cached = await cacheService.get<{
    score: number;
    factors: Array<{ factor: string; impact: string; suggestion: string }>;
    overallAssessment: string;
    originalityScore: number;
  }>(
    "analyze-engagement",
    { content: content.slice(0, 300), platform }
  );
  
  if (cached) {
    return cached;
  }

  const platformContext = platform ? ` for ${platform}` : "";

  const prompt = `Analyze the following social media post${platformContext} for engagement potential. Provide your response in JSON format:
{
  "score": number between 0-100 indicating engagement potential,
  "factors": [
    {
      "factor": "name of the factor (e.g., 'Hook', 'Clarity', 'Call-to-action')",
      "impact": "positive|negative|neutral",
      "suggestion": "specific suggestion for improvement"
    }
  ],
  "overallAssessment": "brief overall assessment",
  "originalityScore": number between 0-100 indicating originality
}

Post content:
"${content}"`;

  const response = await callGeminiAPI(prompt);

  let result: {
    score: number;
    factors: Array<{ factor: string; impact: string; suggestion: string }>;
    overallAssessment: string;
    originalityScore: number;
  };

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        score: parsed.score || DEFAULT_ENGAGEMENT_SCORE,
        factors: parsed.factors || [],
        overallAssessment: parsed.overallAssessment || "Content has good potential.",
        originalityScore: parsed.originalityScore || DEFAULT_ORIGINALITY_SCORE,
      };
    } else {
      result = {
        score: DEFAULT_ENGAGEMENT_SCORE,
        factors: [],
        overallAssessment: "Content analysis complete.",
        originalityScore: DEFAULT_ORIGINALITY_SCORE,
      };
    }
  } catch (e) {
    result = {
      score: DEFAULT_ENGAGEMENT_SCORE,
      factors: [],
      overallAssessment: "Content has moderate engagement potential.",
      originalityScore: DEFAULT_ORIGINALITY_SCORE,
    };
  }

  // Cache for 6 hours
  await cacheService.set("analyze-engagement", { content: content.slice(0, 300), platform }, result, 21600);

  return result;
}

/**
 * Generate headline suggestions
 */
export async function generateHeadline(request: GenerateHeadlineRequest): Promise<{
  headlines: string[];
}> {
  const { content, count = 3 } = request;

  // Check cache first
  const cached = await cacheService.get<{ headlines: string[] }>(
    "generate-headline",
    { content: content.slice(0, 200), count }
  );
  
  if (cached) {
    return cached;
  }

  const prompt = `Based on the following content, generate ${count} compelling headlines that are attention-grabbing, clear, and relevant. Each headline should be concise (60 characters or less).

Content:
"${content.slice(0, 500)}"

Provide only the headlines, one per line, without numbering or additional text.`;

  const response = await callGeminiAPI(prompt);

  const headlines = response
    .split("\n")
    .map(line => line.trim().replace(/^[0-9]+\.\s*/, "").replace(/^[-•*]\s*/, ""))
    .filter(line => line.length > 0 && line.length <= MAX_HEADLINE_LENGTH)
    .slice(0, count);

  const result = { headlines };

  // Cache for 6 hours
  await cacheService.set("generate-headline", { content: content.slice(0, 200), count }, result, 21600);

  return result;
}

/**
 * Generate summary
 */
export async function generateSummary(request: GenerateSummaryRequest): Promise<{
  summary: string;
}> {
  const { content, maxLength = 200 } = request;

  // Check cache first
  const cached = await cacheService.get<{ summary: string }>(
    "generate-summary",
    { content: content.slice(0, 500), maxLength }
  );
  
  if (cached) {
    return cached;
  }

  const prompt = `Create a concise summary of the following content in ${maxLength} characters or less. The summary should capture the main points and be engaging.

Content:
"${content}"

Provide only the summary without any prefixes or explanations.`;

  const summary = await callGeminiAPI(prompt);

  const result = {
    summary: summary.trim().slice(0, maxLength + SUMMARY_LENGTH_BUFFER), // Allow some buffer
  };

  // Cache for 6 hours
  await cacheService.set("generate-summary", { content: content.slice(0, 500), maxLength }, result, 21600);

  return result;
}

/**
 * Generate call-to-action
 */
export async function generateCTA(request: GenerateCTARequest): Promise<{
  ctas: string[];
}> {
  const { content, platform, count = 2 } = request;

  // Check cache first
  const cached = await cacheService.get<{ ctas: string[] }>(
    "generate-cta",
    { content: content.slice(0, 200), platform, count }
  );
  
  if (cached) {
    return cached;
  }

  const platformContext = platform ? ` suitable for ${platform}` : "";

  const prompt = `Based on the following content, generate ${count} compelling call-to-action statements${platformContext}. Each CTA should be action-oriented, clear, and encourage engagement.

Content:
"${content.slice(0, 500)}"

Provide only the CTAs, one per line, without numbering or additional text.`;

  const response = await callGeminiAPI(prompt);

  const ctas = response
    .split("\n")
    .map(line => line.trim().replace(/^[0-9]+\.\s*/, "").replace(/^[-•*]\s*/, ""))
    .filter(line => line.length > 0 && line.length <= MAX_HEADLINE_LENGTH)
    .slice(0, count);

  const result = { ctas };

  // Cache for 6 hours
  await cacheService.set("generate-cta", { content: content.slice(0, 200), platform, count }, result, 21600);

  return result;
}

/**
 * Optimize post with comprehensive AI analysis and improvements
 */
export async function optimizePost(request: OptimizePostRequest): Promise<{
  optimizedTitle: string;
  optimizedContent: string;
  suggestions: string[];
  improvements: Array<{ area: string; change: string }>;
  qualityScores: {
    grammar: number;
    engagement: number;
    originality: number;
  };
}> {
  const { title, content, platform, targetTone } = request;

  // Check cache first
  const cached = await cacheService.get<{
    optimizedTitle: string;
    optimizedContent: string;
    suggestions: string[];
    improvements: Array<{ area: string; change: string }>;
    qualityScores: {
      grammar: number;
      engagement: number;
      originality: number;
    };
  }>(
    "optimize-post",
    { title: title.slice(0, 100), content: content.slice(0, 300), platform, targetTone }
  );
  
  if (cached) {
    return cached;
  }

  const toneContext = targetTone ? ` with a ${targetTone} tone` : "";
  const platformContext = platform ? ` for ${platform}` : "";

  const prompt = `Optimize the following social media post${platformContext}${toneContext}. Provide comprehensive improvements in JSON format:
{
  "optimizedTitle": "improved title",
  "optimizedContent": "improved content with better structure, clarity, and engagement",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "improvements": [
    { "area": "grammar|structure|engagement|clarity", "change": "description of what was improved" }
  ],
  "qualityScores": {
    "grammar": 0-100,
    "engagement": 0-100,
    "originality": 0-100
  }
}

Original Title: "${title}"

Original Content:
"${content}"

Focus on:
- Correcting grammar and spelling
- Improving clarity and flow
- Enhancing engagement potential
- Maintaining authenticity
- Adding compelling elements`;

  const response = await callGeminiAPI(prompt);

  let result: {
    optimizedTitle: string;
    optimizedContent: string;
    suggestions: string[];
    improvements: Array<{ area: string; change: string }>;
    qualityScores: {
      grammar: number;
      engagement: number;
      originality: number;
    };
  };

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        optimizedTitle: parsed.optimizedTitle || title,
        optimizedContent: parsed.optimizedContent || content,
        suggestions: parsed.suggestions || [],
        improvements: parsed.improvements || [],
        qualityScores: parsed.qualityScores || {
          grammar: 90,
          engagement: 85,
          originality: 80,
        },
      };
    } else {
      result = {
        optimizedTitle: title,
        optimizedContent: content,
        suggestions: ["Content is already well-optimized"],
        improvements: [],
        qualityScores: {
          grammar: 90,
          engagement: 85,
          originality: 80,
        },
      };
    }
  } catch (e) {
    result = {
      optimizedTitle: title,
      optimizedContent: content,
      suggestions: ["Unable to optimize at this time"],
      improvements: [],
      qualityScores: {
        grammar: 85,
        engagement: 80,
        originality: 75,
      },
    };
  }

  // Cache for 3 hours
  await cacheService.set("optimize-post", { title: title.slice(0, 100), content: content.slice(0, 300), platform, targetTone }, result, 10800);

  return result;
}
