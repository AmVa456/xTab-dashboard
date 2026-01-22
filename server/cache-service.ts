/**
 * MongoDB Cache Service
 * Caches AI responses to reduce API calls and costs
 */

import { MongoClient, Db, Collection } from "mongodb";

interface CacheEntry {
  key: string;
  value: any;
  createdAt: Date;
  expiresAt: Date;
  requestType: string;
}

class CacheService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private cache: Collection<CacheEntry> | null = null;
  private enabled: boolean = false;

  /**
   * Initialize MongoDB connection
   */
  async initialize() {
    const mongoUrl = process.env.MONGODB_URL;
    
    if (!mongoUrl) {
      console.log("MongoDB not configured - caching disabled");
      return;
    }

    try {
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db("xtab_cache");
      this.cache = this.db.collection<CacheEntry>("ai_responses");
      
      // Create index on key for faster lookups
      await this.cache.createIndex({ key: 1 });
      
      // Create TTL index to auto-delete expired entries
      await this.cache.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      this.enabled = true;
      console.log("MongoDB cache initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MongoDB cache:", error);
      this.enabled = false;
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(requestType: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as any);
    
    return `${requestType}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cached response
   */
  async get<T>(requestType: string, params: any): Promise<T | null> {
    if (!this.enabled || !this.cache) {
      return null;
    }

    try {
      const key = this.generateKey(requestType, params);
      const entry = await this.cache.findOne({ 
        key,
        expiresAt: { $gt: new Date() }
      });

      if (entry) {
        console.log(`Cache hit for ${requestType}`);
        return entry.value as T;
      }

      console.log(`Cache miss for ${requestType}`);
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set cached response with TTL
   */
  async set(requestType: string, params: any, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.enabled || !this.cache) {
      return;
    }

    try {
      const key = this.generateKey(requestType, params);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      await this.cache.updateOne(
        { key },
        {
          $set: {
            key,
            value,
            createdAt: now,
            expiresAt,
            requestType,
          }
        },
        { upsert: true }
      );

      console.log(`Cached ${requestType} for ${ttlSeconds}s`);
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  /**
   * Clear cache for specific request type
   */
  async clear(requestType?: string): Promise<void> {
    if (!this.enabled || !this.cache) {
      return;
    }

    try {
      if (requestType) {
        await this.cache.deleteMany({ requestType });
        console.log(`Cleared cache for ${requestType}`);
      } else {
        await this.cache.deleteMany({});
        console.log("Cleared all cache");
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.enabled = false;
      console.log("MongoDB cache connection closed");
    }
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
