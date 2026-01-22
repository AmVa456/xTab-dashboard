# AI Features Documentation

## Overview

The xTab Dashboard includes AI-powered features to enhance content creation and management. These features use Google's Gemini API to provide intelligent suggestions and assistance.

## Features

### 1. AI Content Generation
- **Location**: Post creation/edit form
- **Description**: Automatically generate post content based on a topic
- **Usage**: 
  1. Enter a title/topic for your post
  2. (Optional) Select a platform
  3. Click "AI Generate Content" button
  4. The AI will generate a title, excerpt, and content for your post

### 2. AI Image Generation
- **Location**: Post creation/edit form
- **Description**: Generate image concepts and prompts for your posts
- **Usage**:
  1. Enter a title or content
  2. Click "AI Generate Image" button
  3. A placeholder image is generated (can be integrated with DALL-E/Midjourney)

### 3. Hashtag Suggestions
- **Location**: Post creation/edit form
- **Description**: Get relevant hashtag suggestions for your content
- **Usage**:
  1. Write your post content
  2. (Optional) Select a platform
  3. Click "Suggest Hashtags" button
  4. Click on suggested hashtags to add them to your content

### 4. AI Chat Assistant
- **Location**: Floating button in bottom-right corner
- **Description**: Interactive AI assistant for content ideas and optimization
- **Usage**:
  1. Click the sparkle icon button in the bottom-right
  2. Ask questions or request help with content
  3. Get suggestions and tips in real-time

## Configuration

See .env.example for configuration details.

## Support

For detailed technical documentation, API references, and troubleshooting, see the inline code documentation.

## Advanced Features

### DALL-E Image Generation

The system now supports actual image generation using OpenAI's DALL-E 3 API:

**Configuration:**
```bash
OPENAI_API_KEY=your_openai_api_key
```

**How it works:**
1. When you click "AI Generate Image", the system:
   - First generates an optimized prompt using Gemini
   - Then uses that prompt with DALL-E 3 to create an actual image
   - Returns the generated image URL
2. If DALL-E is not configured, falls back to placeholder images
3. Generated images are cached for 24 hours to reduce costs

**Cost Considerations:**
- DALL-E 3 Standard: ~$0.040 per image (1024x1024)
- Enable caching to minimize repeated generation costs

### MongoDB Caching

Response caching significantly reduces API costs and improves performance:

**Configuration:**
```bash
MONGODB_URL=mongodb://localhost:27017
# OR for MongoDB Atlas:
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
```

**Cache TTLs:**
- Content generation: 1 hour
- Hashtag suggestions: 6 hours  
- Chat responses: 12 hours (context-independent only)
- Image generation: 24 hours

**Benefits:**
- Reduces API costs by reusing common requests
- Faster response times for cached queries
- Automatic expiration of stale data

**Cache Management:**
The cache automatically:
- Indexes by request parameters for fast lookups
- Expires old entries using MongoDB TTL indexes
- Cleans up on server shutdown

**Monitoring:**
Check server logs for cache hit/miss information:
```
Cache hit for generate-content
Cache miss for suggest-hashtags
Cached generate-image for 86400s
```

## Cost Optimization

With caching enabled, typical costs:

**Without Caching:**
- 100 content requests: ~$0.50 (Gemini)
- 50 image requests: ~$2.00 (DALL-E)
- Total: ~$2.50/day

**With Caching (80% hit rate):**
- 100 content requests: ~$0.10
- 50 image requests: ~$0.40
- Total: ~$0.50/day

**Recommendations:**
1. Enable MongoDB caching for production
2. Monitor cache hit rates in logs
3. Adjust TTL values based on your use case
4. Consider using DALL-E 2 for lower costs if quality isn't critical

