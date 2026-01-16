import { z } from "zod";

// Platform type definition
export type Platform = {
  id: string;
  name: string;
  type: string; // 'forum', 'blog', 'social'
  color: string;
  isConnected: number; // 0 or 1
};

// Post type definition
export type Post = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  platformId: string;
  status: string; // 'draft', 'published', 'scheduled', 'failed'
  likes: number;
  comments: number;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// Zod schemas for validation
export const insertPlatformSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  color: z.string().min(1),
  isConnected: z.number().int().min(0).max(1).optional().default(0),
});

export const insertPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  platformId: z.string().min(1),
  status: z.string().min(1),
  scheduledFor: z.date().optional().nullable(),
  publishedAt: z.date().optional().nullable(),
});

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
