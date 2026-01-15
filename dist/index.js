// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  platforms;
  posts;
  constructor() {
    this.platforms = /* @__PURE__ */ new Map();
    this.posts = /* @__PURE__ */ new Map();
    this.initializeData();
  }
  initializeData() {
    const defaultPlatforms = [
      {
        id: "reddit",
        name: "Reddit",
        type: "forum",
        color: "bg-orange-500",
        isConnected: 1
      },
      {
        id: "twitter",
        name: "Twitter",
        type: "social",
        color: "bg-blue-400",
        isConnected: 1
      },
      {
        id: "medium",
        name: "Medium",
        type: "blog",
        color: "bg-black",
        isConnected: 0
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        type: "social",
        color: "bg-blue-600",
        isConnected: 1
      },
      {
        id: "tumblr",
        name: "Tumblr",
        type: "blog",
        // or "forum", "blog"
        color: "bg-blue-500",
        isConnected: 1
      }
    ];
    defaultPlatforms.forEach((platform) => {
      this.platforms.set(platform.id, platform);
    });
    const samplePosts = [
      {
        id: randomUUID(),
        title: "Understanding Modern Web Development Trends",
        content: "A comprehensive look at the latest frameworks and tools shaping web development...",
        excerpt: "A comprehensive look at the latest frameworks and tools...",
        platformId: "reddit",
        status: "published",
        likes: 234,
        comments: 42,
        scheduledFor: null,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1e3),
        // 2 hours ago
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1e3),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1e3)
      },
      {
        id: randomUUID(),
        title: "Building Better User Experiences",
        content: "Tips and strategies for improving UX design in modern applications...",
        excerpt: "Tips and strategies for improving UX design...",
        platformId: "twitter",
        status: "scheduled",
        likes: 0,
        comments: 0,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1e3),
        // Tomorrow
        publishedAt: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1e3),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1e3)
      },
      {
        id: randomUUID(),
        title: "The Future of Remote Work",
        content: "Exploring trends and challenges in distributed teams...",
        excerpt: "Exploring trends and challenges in distributed teams...",
        platformId: "linkedin",
        status: "published",
        likes: 189,
        comments: 23,
        scheduledFor: null,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1e3),
        // 1 day ago
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1e3),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1e3)
      },
      {
        id: randomUUID(),
        title: "AI and Machine Learning in 2024",
        content: "Key developments and predictions for AI adoption across industries...",
        excerpt: "Key developments and predictions for AI adoption...",
        platformId: "medium",
        status: "draft",
        likes: 0,
        comments: 0,
        scheduledFor: null,
        publishedAt: null,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1e3),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1e3)
      }
    ];
    samplePosts.forEach((post) => {
      this.posts.set(post.id, post);
    });
  }
  // Platform methods
  async getPlatforms() {
    return Array.from(this.platforms.values());
  }
  async getPlatform(id) {
    return this.platforms.get(id);
  }
  async createPlatform(insertPlatform) {
    const id = randomUUID();
    const platform = {
      ...insertPlatform,
      id,
      isConnected: insertPlatform.isConnected ?? 0
    };
    this.platforms.set(id, platform);
    return platform;
  }
  async updatePlatform(id, updates) {
    const platform = this.platforms.get(id);
    if (!platform) return void 0;
    const updated = { ...platform, ...updates };
    this.platforms.set(id, updated);
    return updated;
  }
  // Post methods
  async getPosts() {
    return Array.from(this.posts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getPost(id) {
    return this.posts.get(id);
  }
  async createPost(insertPost) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const post = {
      ...insertPost,
      id,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      comments: 0,
      excerpt: insertPost.excerpt ?? null,
      scheduledFor: insertPost.scheduledFor ?? null,
      publishedAt: insertPost.publishedAt ?? null
    };
    this.posts.set(id, post);
    return post;
  }
  async updatePost(id, updates) {
    const post = this.posts.get(id);
    if (!post) return void 0;
    const updated = { ...post, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.posts.set(id, updated);
    return updated;
  }
  async deletePost(id) {
    return this.posts.delete(id);
  }
  async getPostsByPlatform(platformId) {
    return Array.from(this.posts.values()).filter((post) => post.platformId === platformId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  async getPostsByStatus(status) {
    return Array.from(this.posts.values()).filter((post) => post.status === status).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'forum', 'blog', 'social'
  color: text("color").notNull(),
  isConnected: integer("is_connected").notNull().default(0)
  // 0 or 1
});
var posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  platformId: text("platform_id").notNull(),
  status: text("status").notNull(),
  // 'draft', 'published', 'scheduled', 'failed'
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});
var insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true
});
var insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/platforms", async (req, res) => {
    try {
      const platforms2 = await storage.getPlatforms();
      res.json(platforms2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const { platform, status } = req.query;
      let posts2;
      if (platform && platform !== "all") {
        posts2 = await storage.getPostsByPlatform(platform);
      } else if (status && status !== "all") {
        posts2 = await storage.getPostsByStatus(status);
      } else {
        posts2 = await storage.getPosts();
      }
      res.json(posts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
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
  app2.post("/api/posts", async (req, res) => {
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
  app2.put("/api/posts/:id", async (req, res) => {
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
  app2.delete("/api/posts/:id", async (req, res) => {
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
  app2.get("/api/analytics", async (req, res) => {
    try {
      const posts2 = await storage.getPosts();
      const platforms2 = await storage.getPlatforms();
      const totalPosts = posts2.length;
      const scheduledPosts = posts2.filter((p) => p.status === "scheduled").length;
      const publishedPosts = posts2.filter((p) => p.status === "published");
      const totalEngagement = publishedPosts.reduce((sum, post) => sum + post.likes + post.comments, 0);
      const totalReach = publishedPosts.reduce((sum, post) => sum + post.likes * 5, 0);
      const platformStats = platforms2.map((platform) => {
        const platformPosts = publishedPosts.filter((p) => p.platformId === platform.id);
        const engagement = platformPosts.reduce((sum, post) => sum + post.likes + post.comments, 0);
        return { platform: platform.name, engagement };
      });
      const bestPlatform = platformStats.reduce(
        (best, current) => current.engagement > best.engagement ? current : best
      ).platform;
      const thisWeekPosts = posts2.filter((post) => {
        const postDate = new Date(post.createdAt);
        const weekAgo = /* @__PURE__ */ new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return postDate > weekAgo;
      }).length;
      res.json({
        totalPosts,
        scheduledPosts,
        engagement: totalEngagement,
        reach: totalReach > 1e3 ? `${(totalReach / 1e3).toFixed(1)}K` : totalReach.toString(),
        bestPlatform,
        engagementRate: publishedPosts.length > 0 ? `${(totalEngagement / publishedPosts.length * 0.1).toFixed(1)}%` : "0%",
        postsThisWeek: thisWeekPosts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  base: "/xTab-dasboard/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
