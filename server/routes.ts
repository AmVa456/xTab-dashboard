import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import * as aiService from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { platform, status } = req.query;
      
      let posts;
      if (platform && platform !== 'all') {
        posts = await storage.getPostsByPlatform(platform as string);
      } else if (status && status !== 'all') {
        posts = await storage.getPostsByStatus(status as string);
      } else {
        posts = await storage.getPosts();
      }
      
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const post = await storage.updatePost(req.params.id, updates);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const success = await storage.deletePost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      const platforms = await storage.getPlatforms();
      
      const totalPosts = posts.length;
      const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
      const publishedPosts = posts.filter(p => p.status === 'published');
      
      const totalEngagement = publishedPosts.reduce((sum, post) => sum + post.likes + post.comments, 0);
      const totalReach = publishedPosts.reduce((sum, post) => sum + post.likes * 5, 0); // Simulated reach calculation
      
      // Find best performing platform
      const platformStats = platforms.map(platform => {
        const platformPosts = publishedPosts.filter(p => p.platformId === platform.id);
        const engagement = platformPosts.reduce((sum, post) => sum + post.likes + post.comments, 0);
        return { platform: platform.name, engagement };
      });
      
      const bestPlatform = platformStats.reduce((best, current) => 
        current.engagement > best.engagement ? current : best
      ).platform;

      const thisWeekPosts = posts.filter(post => {
        const postDate = new Date(post.createdAt!);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return postDate > weekAgo;
      }).length;

      res.json({
        totalPosts,
        scheduledPosts,
        engagement: totalEngagement,
        reach: totalReach > 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach.toString(),
        bestPlatform,
        engagementRate: publishedPosts.length > 0 ? `${((totalEngagement / publishedPosts.length) * 0.1).toFixed(1)}%` : "0%",
        postsThisWeek: thisWeekPosts,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // AI endpoints
  // Check if AI features are enabled
  app.get("/api/ai/status", (req, res) => {
    res.json({ 
      enabled: aiService.isAIEnabled(),
      message: aiService.isAIEnabled() 
        ? "AI features are enabled" 
        : "AI features are disabled. Set GEMINI_API_KEY and AI_FEATURES_ENABLED=true to enable."
    });
  });

  // Generate content suggestion
  app.post("/api/ai/generate-content", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.generateContentSchema.parse(req.body);
      const result = await aiService.generateContent(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Generate content error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate content" 
      });
    }
  });

  // Generate image concept/prompt
  app.post("/api/ai/generate-image", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.generateImageSchema.parse(req.body);
      const result = await aiService.generateImage(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Generate image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Suggest hashtags
  app.post("/api/ai/suggest-hashtags", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.suggestHashtagsSchema.parse(req.body);
      const result = await aiService.suggestHashtags(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Suggest hashtags error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to suggest hashtags" 
      });
    }
  });

  // AI chat assistant
  app.post("/api/ai/chat", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.chatSchema.parse(req.body);
      const result = await aiService.chat(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Chat error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat message" 
      });
    }
  });

  // Adjust tone
  app.post("/api/ai/adjust-tone", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.adjustToneSchema.parse(req.body);
      const result = await aiService.adjustTone(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Adjust tone error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to adjust tone" 
      });
    }
  });

  // Check grammar
  app.post("/api/ai/check-grammar", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.checkGrammarSchema.parse(req.body);
      const result = await aiService.checkGrammar(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Check grammar error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to check grammar" 
      });
    }
  });

  // Analyze engagement
  app.post("/api/ai/analyze-engagement", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.analyzeEngagementSchema.parse(req.body);
      const result = await aiService.analyzeEngagement(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Analyze engagement error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze engagement" 
      });
    }
  });

  // Generate headline
  app.post("/api/ai/generate-headline", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.generateHeadlineSchema.parse(req.body);
      const result = await aiService.generateHeadline(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Generate headline error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate headline" 
      });
    }
  });

  // Generate summary
  app.post("/api/ai/generate-summary", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.generateSummarySchema.parse(req.body);
      const result = await aiService.generateSummary(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Generate summary error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate summary" 
      });
    }
  });

  // Generate CTA
  app.post("/api/ai/generate-cta", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.generateCTASchema.parse(req.body);
      const result = await aiService.generateCTA(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Generate CTA error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate CTA" 
      });
    }
  });

  // Optimize post
  app.post("/api/ai/optimize-post", async (req, res) => {
    if (!aiService.isAIEnabled()) {
      return res.status(503).json({ 
        message: "AI features are not enabled. Configure GEMINI_API_KEY and set AI_FEATURES_ENABLED=true." 
      });
    }

    try {
      const validatedData = aiService.optimizePostSchema.parse(req.body);
      const result = await aiService.optimizePost(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      console.error("Optimize post error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to optimize post" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
