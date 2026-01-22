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

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// AI Metadata schema
export const aiMetadataSchema = z.object({
  isAIGenerated: z.boolean().optional(),
  tone: z.enum(["professional", "casual", "friendly", "formal", "humorous"]).optional(),
  generatedAt: z.string().optional(),
  originalPrompt: z.string().optional(),
  modifications: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    description: z.string(),
  })).optional(),
  qualityScores: z.object({
    grammar: z.number().optional(),
    engagement: z.number().optional(),
    originality: z.number().optional(),
  }).optional(),
});

export type AIMetadata = z.infer<typeof aiMetadataSchema>;
