/**
 * Hashtag Intelligence Service
 * Manages AI-generated hashtag suggestions and analytics in MongoDB
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import type { HashtagSuggestion, HashtagAnalytics } from "@shared/schema";

interface HashtagDocument extends Omit<HashtagSuggestion, 'id'> {
  _id?: ObjectId;
}

interface HashtagAnalyticsDocument extends HashtagAnalytics {
  _id?: ObjectId;
}

class HashtagService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private suggestions: Collection<HashtagDocument> | null = null;
  private analytics: Collection<HashtagAnalyticsDocument> | null = null;
  private enabled: boolean = false;

  /**
   * Initialize MongoDB connection for hashtag storage
   */
  async initialize() {
    const mongoUrl = process.env.MONGODB_URL;
    
    if (!mongoUrl) {
      console.log("MongoDB not configured - hashtag storage disabled");
      return;
    }

    try {
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db("xtab_hashtags");
      
      this.suggestions = this.db.collection<HashtagDocument>("suggestions");
      this.analytics = this.db.collection<HashtagAnalyticsDocument>("analytics");
      
      // Create indexes for efficient queries
      await this.suggestions.createIndex({ postId: 1 });
      await this.suggestions.createIndex({ platform: 1 });
      await this.suggestions.createIndex({ createdAt: -1 });
      await this.suggestions.createIndex({ "hashtags.tag": 1 });
      
      await this.analytics.createIndex({ hashtag: 1, platform: 1 }, { unique: true });
      await this.analytics.createIndex({ totalSelections: -1 });
      await this.analytics.createIndex({ selectionRate: -1 });
      
      this.enabled = true;
      console.log("Hashtag service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize hashtag service:", error);
      this.enabled = false;
    }
  }

  /**
   * Check if hashtag service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Save hashtag suggestions
   */
  async saveSuggestions(suggestion: Omit<HashtagSuggestion, 'id'>): Promise<HashtagSuggestion | null> {
    if (!this.enabled || !this.suggestions) {
      return null;
    }

    try {
      const doc: HashtagDocument = {
        ...suggestion,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.suggestions.insertOne(doc);
      
      // Update analytics for each hashtag
      await this.updateAnalytics(suggestion.hashtags, suggestion.platform);
      
      return {
        ...doc,
        id: result.insertedId.toString(),
      };
    } catch (error) {
      console.error("Failed to save hashtag suggestions:", error);
      return null;
    }
  }

  /**
   * Get hashtag suggestions by post ID
   */
  async getSuggestionsByPost(postId: string): Promise<HashtagSuggestion | null> {
    if (!this.enabled || !this.suggestions) {
      return null;
    }

    try {
      const doc = await this.suggestions.findOne({ postId });
      if (!doc) return null;

      return {
        ...doc,
        id: doc._id?.toString(),
      };
    } catch (error) {
      console.error("Failed to get hashtag suggestions:", error);
      return null;
    }
  }

  /**
   * Update hashtag selection status
   */
  async updateSelection(suggestionId: string, hashtag: string, selected: boolean): Promise<boolean> {
    if (!this.enabled || !this.suggestions || !this.analytics) {
      return false;
    }

    try {
      const objectId = new ObjectId(suggestionId);
      
      // Get the suggestion to retrieve platform info
      const suggestion = await this.suggestions.findOne({ _id: objectId });
      if (!suggestion) {
        return false;
      }
      
      // Update the hashtag in the suggestion
      await this.suggestions.updateOne(
        { _id: objectId, "hashtags.tag": hashtag },
        {
          $set: {
            "hashtags.$.selected": selected,
            updatedAt: new Date(),
          },
          $inc: {
            "hashtags.$.selectionCount": selected ? 1 : -1,
          },
        }
      );

      // Update analytics with platform context
      if (selected) {
        await this.incrementSelection(hashtag, suggestion.platform);
      }

      return true;
    } catch (error) {
      console.error("Failed to update hashtag selection:", error);
      return false;
    }
  }

  /**
   * Get trending hashtags by platform
   */
  async getTrendingHashtags(platform?: string, limit: number = 10): Promise<string[]> {
    if (!this.enabled || !this.analytics) {
      return [];
    }

    try {
      const query = platform ? { platform } : {};
      const trending = await this.analytics
        .find(query)
        .sort({ totalSelections: -1, selectionRate: -1 })
        .limit(limit)
        .toArray();

      return trending.map(h => h.hashtag);
    } catch (error) {
      console.error("Failed to get trending hashtags:", error);
      return [];
    }
  }

  /**
   * Get hashtag analytics
   */
  async getHashtagAnalytics(platform?: string, limit: number = 20): Promise<HashtagAnalytics[]> {
    if (!this.enabled || !this.analytics) {
      return [];
    }

    try {
      const query = platform ? { platform } : {};
      const results = await this.analytics
        .find(query)
        .sort({ totalSelections: -1 })
        .limit(limit)
        .toArray();

      return results;
    } catch (error) {
      console.error("Failed to get hashtag analytics:", error);
      return [];
    }
  }

  /**
   * Update analytics when hashtags are suggested
   */
  private async updateAnalytics(
    hashtags: Array<{ tag: string; isAIGenerated: boolean }>,
    platform?: string
  ): Promise<void> {
    if (!this.analytics) return;

    try {
      for (const hashtag of hashtags) {
        const filter = { 
          hashtag: hashtag.tag, 
          platform: platform || null  // Use null instead of empty string
        };
        
        await this.analytics.updateOne(
          filter,
          {
            $inc: { totalSuggestions: 1 },
            $setOnInsert: {
              hashtag: hashtag.tag,
              platform: platform || null,
              totalSelections: 0,
              selectionRate: 0,
            },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error("Failed to update hashtag analytics:", error);
    }
  }

  /**
   * Increment selection count for a hashtag
   */
  private async incrementSelection(hashtag: string, platform?: string): Promise<void> {
    if (!this.analytics) return;

    try {
      // Get current stats to calculate selection rate, matching by hashtag and platform
      const current = await this.analytics.findOne({ 
        hashtag, 
        platform: platform || null 
      });
      
      if (current) {
        const newSelections = current.totalSelections + 1;
        const selectionRate = (newSelections / current.totalSuggestions) * 100;

        await this.analytics.updateOne(
          { hashtag, platform: platform || null },
          {
            $inc: { totalSelections: 1 },
            $set: {
              selectionRate,
              lastUsed: new Date(),
            },
          }
        );
      }
    } catch (error) {
      console.error("Failed to increment selection:", error);
    }
  }

  /**
   * Delete old suggestions (cleanup)
   */
  async cleanupOldSuggestions(daysOld: number = 30): Promise<number> {
    if (!this.enabled || !this.suggestions) {
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.suggestions.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      console.log(`Cleaned up ${result.deletedCount} old hashtag suggestions`);
      return result.deletedCount;
    } catch (error) {
      console.error("Failed to cleanup old suggestions:", error);
      return 0;
    }
  }

  /**
   * Close MongoDB connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.enabled = false;
      console.log("Hashtag service connection closed");
    }
  }
}

// Export singleton instance
export const hashtagService = new HashtagService();
