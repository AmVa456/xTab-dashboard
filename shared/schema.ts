import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const platforms = pgTable("platforms", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'forum', 'blog', 'social'
  color: text("color").notNull(),
  isConnected: integer("is_connected").notNull().default(0), // 0 or 1
});

export const posts = pgTable("posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  platformId: text("platform_id").notNull(),
  status: text("status").notNull(), // 'draft', 'published', 'scheduled', 'failed'
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  aiMetadata: jsonb("ai_metadata"), // AI-generated metadata
});

// Cover image validation schema
export const coverImageSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  prompt: z.string().min(1, "Prompt is required"),
  style: z.string().optional(),
  generatedAt: z.string().datetime(),
  attribution: z.string().default("AI Generated with DALL-E 3"),
}).nullable().optional();

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  coverImage: coverImageSchema,
});

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Hashtag-related types and schemas (stored in MongoDB)
export const hashtagSuggestionSchema = z.object({
  id: z.string().optional(), // MongoDB _id
  postId: z.string().optional(), // Reference to post if associated
  content: z.string(), // Content the hashtags were generated for
  platform: z.string().optional(), // Platform name
  hashtags: z.array(z.object({
    tag: z.string(), // The hashtag (with #)
    isAIGenerated: z.boolean().default(true), // AI vs user added
    relevanceScore: z.number().optional(), // 0-1 relevance score
    trending: z.boolean().default(false), // Is it trending?
    selected: z.boolean().default(false), // Was it selected by user?
    selectionCount: z.number().default(0), // How many times selected
  })),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type HashtagSuggestion = z.infer<typeof hashtagSuggestionSchema>;

// Hashtag analytics schema
export const hashtagAnalyticsSchema = z.object({
  hashtag: z.string(),
  platform: z.string().optional(),
  totalSuggestions: z.number().default(0),
  totalSelections: z.number().default(0),
  selectionRate: z.number().default(0), // percentage
  lastUsed: z.date().optional(),
  performance: z.object({
    avgLikes: z.number().default(0),
    avgComments: z.number().default(0),
    avgEngagement: z.number().default(0),
  }).optional(),
});

export type HashtagAnalytics = z.infer<typeof hashtagAnalyticsSchema>;
