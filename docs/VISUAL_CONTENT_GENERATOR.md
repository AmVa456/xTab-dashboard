# Visual Content Generator - AI Image Integration

## Overview

The Visual Content Generator is an AI-powered feature that helps create high-quality cover images for social media posts using DALL-E 3 and Gemini AI. It provides a comprehensive workflow for generating, previewing, selecting, and managing AI-generated images.

## Features

### ✨ Core Capabilities

1. **AI-Powered Image Generation**
   - Generate images using DALL-E 3 via OpenAI API
   - Intelligent prompt optimization using Gemini AI
   - Multiple style options for different aesthetics
   - Custom prompts or auto-generation from post content

2. **Interactive Image Gallery**
   - Preview all generated images in a grid layout
   - Select/deselect images with visual feedback
   - Generate multiple variations and compare
   - Remove unwanted images from the gallery

3. **Smart Integration**
   - Seamless integration with Post Composer
   - Images stored with post metadata
   - Attribution and watermark display
   - Persistent image selection when editing posts

4. **Image Metadata Storage**
   - URL to the generated image
   - Original prompt used for generation
   - Style preference applied
   - Generation timestamp
   - AI attribution information

## Usage Guide

### Getting Started

#### Prerequisites

1. **Enable AI Features**
   ```bash
   AI_FEATURES_ENABLED=true
   ```

2. **Configure API Keys**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key  # For DALL-E image generation
   ```

3. **Optional: Enable Caching** (Recommended for cost savings)
   ```bash
   MONGODB_URL=mongodb://localhost:27017
   ```

### Using the Visual Content Generator

#### Step 1: Access the Image Generator

1. Open the Post Composer (Create/Edit Post dialog)
2. Scroll to the "AI Cover Image Generator" section
3. The generator appears below the AI-powered content features

#### Step 2: Generate an Image

**Option A: Auto-generation from Post Content**
1. Enter a post title and/or content
2. Select an image style from the dropdown
3. Click "Generate New Image"
4. Wait 15-30 seconds for DALL-E to create the image

**Option B: Using Custom Prompts**
1. Enter a custom description in the "Custom Prompt" field
2. Select your preferred image style
3. Click "Generate New Image"

#### Step 3: Review and Select

1. Generated images appear in a gallery below the controls
2. Click on any image to select it as your cover image
3. The selected image will have a blue border and "Selected" badge
4. Generate multiple images to compare options

#### Step 4: Save with Post

1. Complete your post content
2. The selected cover image will automatically save with the post
3. When editing a post, the existing cover image will be pre-loaded

## Image Styles

The generator offers 8 professional style presets:

| Style | Best For | Example Use Case |
|-------|----------|------------------|
| **Modern & Professional** | Business, tech content | Corporate announcements, product launches |
| **Minimalist & Clean** | Simple, focused messages | Quotes, statistics, single concepts |
| **Vibrant & Colorful** | Eye-catching posts | Events, celebrations, creative content |
| **Dark & Moody** | Dramatic effect | Gaming, entertainment, night themes |
| **Flat Design** | Icons, simple graphics | Infographics, educational content |
| **3D Rendered** | Futuristic, tech-forward | Innovation, technology topics |
| **Abstract Art** | Creative, artistic posts | Design, art, abstract concepts |
| **Photorealistic** | Real-world scenes | Travel, lifestyle, realistic scenarios |

## Sample Prompts

### Effective Prompts by Category

#### Technology & Innovation
```
✓ "A glowing neural network with data flowing through interconnected nodes"
✓ "Futuristic holographic interface with code and AI elements"
✓ "Abstract representation of cloud computing and digital transformation"
```

#### Business & Professional
```
✓ "Modern office workspace with collaboration tools and natural lighting"
✓ "Professional business team meeting in a contemporary boardroom"
✓ "Growth charts and analytics dashboard with upward trends"
```

#### Creative & Marketing
```
✓ "Colorful creative workspace with design tools and inspiration"
✓ "Dynamic social media icons floating in a digital space"
✓ "Marketing campaign concepts with vibrant branding elements"
```

#### Education & Learning
```
✓ "Open book with knowledge symbols and light bulbs"
✓ "Student learning in an interactive digital environment"
✓ "Educational infographic with clear, engaging visuals"
```

### Tips for Better Prompts

#### ✅ DO:
- Be specific and descriptive
- Include style keywords (e.g., "minimalist", "vibrant", "professional")
- Mention colors if important
- Describe the mood or feeling you want
- Keep it between 10-30 words

#### ❌ DON'T:
- Use vague descriptions ("something cool")
- Request copyrighted characters or brands
- Include text/words (DALL-E doesn't do text well)
- Be overly complex (20+ elements)
- Use negative descriptions ("without", "not")

## Technical Implementation

### Database Schema

Cover images are stored as JSONB in the `posts` table:

```typescript
coverImage: {
  url: string;              // DALL-E generated image URL
  prompt: string;           // The prompt used for generation
  style?: string;           // Selected style preset
  generatedAt: string;      // ISO timestamp
  attribution: string;      // "AI Generated with DALL-E 3"
}
```

### API Integration

The image generator uses two AI services:

1. **Gemini AI** - Optimizes prompts for better DALL-E results
   - Endpoint: `/api/ai/generate-image`
   - Takes: `description` and `style`
   - Returns: Optimized `prompt` and `imageUrl`

2. **DALL-E 3** - Generates the actual images
   - Called by the backend via OpenAI SDK
   - Model: `dall-e-3`
   - Size: `1024x1024`
   - Quality: `standard`

### Caching

Generated images are cached in MongoDB for 24 hours to reduce costs:

```javascript
// Cache key format
{
  operation: "generate-image",
  params: { description, style },
  ttl: 86400 // 24 hours
}
```

## Cost Considerations

### DALL-E 3 Pricing

- **Standard Quality**: ~$0.040 per image (1024x1024)
- **HD Quality**: ~$0.080 per image (1024x1024)

### Cost Optimization Strategies

1. **Use Caching** (80% cost reduction)
   - Enable MongoDB caching
   - Same prompts/styles return cached images
   - 24-hour TTL for images

2. **Generate Wisely**
   - Review prompts before generating
   - Use sample prompts as templates
   - Generate 2-3 options, not dozens

3. **Monthly Budget Examples**
   - 50 images/month = ~$2.00
   - 100 images/month = ~$4.00
   - 250 images/month = ~$10.00

With caching (80% hit rate):
   - 50 images/month = ~$0.40
   - 100 images/month = ~$0.80
   - 250 images/month = ~$2.00

## Troubleshooting

### Common Issues

#### Images not generating
**Symptoms**: Generation button does nothing or errors immediately

**Solutions**:
1. Check `OPENAI_API_KEY` is set correctly
2. Verify AI features are enabled (`AI_FEATURES_ENABLED=true`)
3. Check server logs for API errors
4. Confirm OpenAI account has credits

#### Slow generation times
**Symptoms**: Takes longer than 30 seconds

**Solutions**:
1. This is normal - DALL-E 3 takes 15-30 seconds
2. Check internet connection
3. Try simpler prompts
4. Verify OpenAI API status

#### Placeholder images appearing
**Symptoms**: Blue placeholder images instead of AI images

**Solutions**:
1. OpenAI API key not configured - images fall back to placeholders
2. DALL-E API error - check server logs
3. Image generation failed - try regenerating

#### Images not saving with posts
**Symptoms**: Selected images don't appear after saving

**Solutions**:
1. Verify image is selected (blue border, "Selected" badge)
2. Check browser console for errors
3. Confirm post save was successful
4. Try regenerating and reselecting

## Best Practices

### For Content Creators

1. **Generate Before Writing**
   - Create images after deciding on topic
   - Use images to inspire your content
   - Maintain visual consistency

2. **Match Style to Platform**
   - LinkedIn: Professional, clean styles
   - Twitter: Vibrant, attention-grabbing
   - Medium: Artistic, thought-provoking
   - Reddit: Relevant to community norms

3. **A/B Test Images**
   - Generate 2-3 variations
   - Test different styles
   - Note which get more engagement

### For Administrators

1. **Monitor Costs**
   - Track monthly image generation count
   - Set up billing alerts in OpenAI dashboard
   - Review cache hit rates

2. **Optimize Caching**
   - Enable MongoDB caching
   - Monitor cache performance
   - Adjust TTL based on usage patterns

3. **User Guidelines**
   - Provide prompt templates
   - Share best practices
   - Set reasonable usage limits

## Accessibility & Attribution

### Attribution Display

All AI-generated images automatically display attribution:
- Badge on image preview: "AI Generated"
- Metadata includes: "AI Generated with DALL-E 3"
- Transparent about AI usage

### Accessibility Features

- Alt text automatically generated from prompts
- High-contrast selection indicators
- Keyboard navigation support
- Screen reader compatible

## Future Enhancements

Planned features for future releases:

- [ ] Image editing and refinement
- [ ] Batch generation (multiple images at once)
- [ ] Style transfer from existing images
- [ ] Custom aspect ratios (square, portrait, landscape)
- [ ] Image collections/libraries
- [ ] Usage analytics and insights
- [ ] Integration with external image APIs (Midjourney, Stable Diffusion)

## Support

For questions, issues, or feature requests:

1. Check the main [AI Features Documentation](../README_AI_FEATURES.md)
2. Review [API documentation](../docs/AI_FEATURES.md)
3. Check server logs for detailed error messages
4. Open an issue on the GitHub repository

---

**Last Updated**: January 22, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
