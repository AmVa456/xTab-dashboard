import {
  type Platform,
  type InsertPlatform,
  type Post,
  type InsertPost,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(
    id: string,
    updates: Partial<Platform>
  ): Promise<Platform | undefined>;

  // Post methods
  getPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  getPostsByPlatform(platformId: string): Promise<Post[]>;
  getPostsByStatus(status: string): Promise<Post[]>;
}

export class MemStorage implements IStorage {
  private platforms: Map<string, Platform>;
  private posts: Map<string, Post>;

  constructor() {
    this.platforms = new Map();
    this.posts = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize default platforms
    const defaultPlatforms: Platform[] = [
      {
        id: "reddit",
        name: "Reddit",
        type: "forum",
        color: "bg-orange-500",
        isConnected: 1,
      },
      {
        id: "twitter",
        name: "Twitter",
        type: "social",
        color: "bg-blue-400",
        isConnected: 1,
      },
      {
        id: "medium",
        name: "Medium",
        type: "blog",
        color: "bg-black",
        isConnected: 0,
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        type: "social",
        color: "bg-blue-600",
        isConnected: 1,
      },
      {
        id: "tumblr",
        name: "Tumblr",
        type: "blog", // or "forum", "blog"
        color: "bg-blue-500",
        isConnected: 1,
      },
    ];

    defaultPlatforms.forEach((platform) => {
      this.platforms.set(platform.id, platform);
    });

    // Initialize some sample posts
    const samplePosts: Post[] = [
      {
        id: randomUUID(),
        title: "Understanding Modern Web Development Trends",
        content:
          "A comprehensive look at the latest frameworks and tools shaping web development...",
        excerpt: "A comprehensive look at the latest frameworks and tools...",
        platformId: "reddit",
        status: "published",
        likes: 234,
        comments: 42,
        scheduledFor: null,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        coverImage: null,
      },
      {
        id: randomUUID(),
        title: "Building Better User Experiences",
        content:
          "Tips and strategies for improving UX design in modern applications...",
        excerpt: "Tips and strategies for improving UX design...",
        platformId: "twitter",
        status: "scheduled",
        likes: 0,
        comments: 0,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        publishedAt: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        coverImage: null,
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
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        coverImage: null,
      },
      {
        id: randomUUID(),
        title: "AI and Machine Learning in 2024",
        content:
          "Key developments and predictions for AI adoption across industries...",
        excerpt: "Key developments and predictions for AI adoption...",
        platformId: "medium",
        status: "draft",
        likes: 0,
        comments: 0,
        scheduledFor: null,
        publishedAt: null,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        coverImage: null,
      },
    ];

    samplePosts.forEach((post) => {
      this.posts.set(post.id, post);
    });
  }

  // Platform methods
  async getPlatforms(): Promise<Platform[]> {
    return Array.from(this.platforms.values());
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const id = randomUUID();
    const platform: Platform = {
      ...insertPlatform,
      id,
      isConnected: insertPlatform.isConnected ?? 0,
    };
    this.platforms.set(id, platform);
    return platform;
  }

  async updatePlatform(
    id: string,
    updates: Partial<Platform>
  ): Promise<Platform | undefined> {
    const platform = this.platforms.get(id);
    if (!platform) return undefined;

    const updated = { ...platform, ...updates };
    this.platforms.set(id, updated);
    return updated;
  }

  // Post methods
  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      createdAt: now,
      updatedAt: now,
      likes: 0,
      comments: 0,
      excerpt: insertPost.excerpt ?? null,
      scheduledFor: insertPost.scheduledFor ?? null,
      publishedAt: insertPost.publishedAt ?? null,
      coverImage: insertPost.coverImage ?? null,
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(
    id: string,
    updates: Partial<Post>
  ): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const updated = { ...post, ...updates, updatedAt: new Date() };
    this.posts.set(id, updated);
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getPostsByPlatform(platformId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.platformId === platformId)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
  }

  async getPostsByStatus(status: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.status === status)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
  }
}

export const storage = new MemStorage();
