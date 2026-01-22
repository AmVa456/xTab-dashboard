/**
 * AI Image Generator Component
 * Enhanced UI for generating, previewing, and managing AI-generated cover images
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, X, Download, Info } from "lucide-react";
import { useGenerateImage } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import type { CoverImage } from "@shared/schema";

// Non-nullable version for internal use
type GeneratedImage = NonNullable<CoverImage>;

interface AIImageGeneratorProps {
  postTitle: string;
  postContent: string;
  currentImage?: CoverImage | null;
  onImageSelect: (image: CoverImage | null) => void;
  disabled?: boolean;
}

export default function AIImageGenerator({
  postTitle,
  postContent,
  currentImage,
  onImageSelect,
  disabled = false,
}: AIImageGeneratorProps) {
  const { toast } = useToast();
  const generateImageMutation = useGenerateImage();
  
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("modern and professional");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(
    currentImage ? [currentImage] : []
  );
  const [selectedIndex, setSelectedIndex] = useState(currentImage ? 0 : -1);

  const imageStyles = [
    { value: "modern and professional", label: "Modern & Professional" },
    { value: "minimalist and clean", label: "Minimalist & Clean" },
    { value: "vibrant and colorful", label: "Vibrant & Colorful" },
    { value: "dark and moody", label: "Dark & Moody" },
    { value: "flat design", label: "Flat Design" },
    { value: "3D rendered", label: "3D Rendered" },
    { value: "abstract art", label: "Abstract Art" },
    { value: "photorealistic", label: "Photorealistic" },
  ];

  const handleGenerateImage = async () => {
    if (!postTitle && !postContent && !customPrompt) {
      toast({
        title: "Content Required",
        description: "Please enter a title, content, or custom prompt first",
        variant: "destructive",
      });
      return;
    }

    try {
      const description = customPrompt || postTitle || postContent.slice(0, 100);
      
      const result = await generateImageMutation.mutateAsync({
        description,
        style: imageStyle,
      });

      if (result.imageUrl) {
        const newImage: GeneratedImage = {
          url: result.imageUrl,
          prompt: result.prompt,
          style: imageStyle,
          generatedAt: new Date().toISOString(),
          attribution: "AI Generated with DALL-E 3",
        };

        setGeneratedImages((prev) => [newImage, ...prev]);
        setSelectedIndex(0);
        onImageSelect(newImage);

        toast({
          title: "Image Generated Successfully",
          description: "Your AI-generated cover image is ready!",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedIndex(index);
    onImageSelect(generatedImages[index]);
  };

  const handleRemoveImage = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newImages = generatedImages.filter((_, i) => i !== index);
    setGeneratedImages(newImages);
    
    if (index === selectedIndex) {
      setSelectedIndex(-1);
      onImageSelect(null);
    } else if (index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleClearSelection = () => {
    setSelectedIndex(-1);
    onImageSelect(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-xtab-blue" />
          AI Cover Image Generator
        </Label>
        {selectedIndex >= 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Selection
          </Button>
        )}
      </div>

      {/* Generation Controls */}
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="custom-prompt" className="text-sm">
            Custom Prompt (Optional)
          </Label>
          <Input
            id="custom-prompt"
            placeholder="e.g., 'A futuristic cityscape at sunset' or leave empty to use post title"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={disabled || generateImageMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-style" className="text-sm">
            Image Style
          </Label>
          <Select
            value={imageStyle}
            onValueChange={setImageStyle}
            disabled={disabled || generateImageMutation.isPending}
          >
            <SelectTrigger id="image-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageStyles.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  {style.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={handleGenerateImage}
          disabled={disabled || generateImageMutation.isPending}
          className="w-full gap-2"
          variant="outline"
        >
          {generateImageMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate New Image
            </>
          )}
        </Button>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Tips for better images:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Be descriptive and specific with your prompts</li>
            <li>Include style preferences (e.g., "minimalist", "vibrant")</li>
            <li>Generation takes 15-30 seconds per image</li>
          </ul>
        </div>
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Generated Images ({generatedImages.length})
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {generatedImages.map((image, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedIndex === index
                    ? "ring-2 ring-xtab-blue shadow-md"
                    : "opacity-70 hover:opacity-100"
                }`}
                onClick={() => handleImageSelect(index)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <img
                      src={image.url}
                      alt={`Generated ${index + 1}`}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemoveImage(index, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {selectedIndex === index && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-xtab-blue text-white">
                          Selected
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Generated
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Style: {image.style || "Default"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sample Prompts */}
      {generatedImages.length === 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Sample Prompts:
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              "Abstract technology background",
              "Team collaboration workspace",
              "Digital innovation concept",
              "Creative workspace setup",
            ].map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                className="cursor-pointer hover:bg-xtab-blue hover:text-white transition-colors text-xs"
                onClick={() => setCustomPrompt(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
