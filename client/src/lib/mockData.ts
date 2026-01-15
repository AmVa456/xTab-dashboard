import { Platform, Post } from "@shared/schema";

// Generate a simple UUID-like string
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Mock platforms data
export const mockPlatforms: Platform[] = [
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
    type: "blog",
    color: "bg-blue-500",
    isConnected: 1,
  },
];

// Mock posts data
export const mockPosts: Post[] = [
  {
    id: generateId(),
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
  },
  {
    id: generateId(),
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
  },
  {
    id: generateId(),
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
  },
  {
    id: generateId(),
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
  },
  {
    id: generateId(),
    title: "TypeScript Best Practices for 2024",
    content:
      "Essential patterns and practices for writing maintainable TypeScript code...",
    excerpt: "Essential patterns and practices for writing maintainable...",
    platformId: "tumblr",
    status: "published",
    likes: 156,
    comments: 18,
    scheduledFor: null,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

// Calculate mock analytics data
export const getMockAnalytics = () => {
  const totalPosts = mockPosts.length;
  const publishedPosts = mockPosts.filter((p) => p.status === "published").length;
  const scheduledPosts = mockPosts.filter((p) => p.status === "scheduled").length;
  const totalEngagement = mockPosts.reduce(
    (sum, post) => sum + post.likes + post.comments,
    0
  );
  const connectedPlatforms = mockPlatforms.filter((p) => p.isConnected === 1).length;

  return {
    totalPosts,
    publishedPosts,
    scheduledPosts,
    totalEngagement,
    connectedPlatforms,
    avgEngagement: publishedPosts > 0 ? Math.round(totalEngagement / publishedPosts) : 0,
  };
};
