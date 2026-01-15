import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { mockPlatforms, mockPosts, getMockAnalytics } from "./mockData";

// Detect if we're running in static/demo mode (e.g., GitHub Pages)
// Check if API endpoint is not available
let isStaticMode = false;

// Test if backend is available
async function checkBackendAvailability() {
  try {
    const response = await fetch("/api/platforms", {
      method: "HEAD",
      credentials: "include",
    });
    isStaticMode = !response.ok;
  } catch {
    isStaticMode = true;
  }
}

// Initialize backend check
checkBackendAvailability();

// Mock data handler for static mode
function getMockDataForQuery(queryKey: readonly unknown[]): unknown {
  const path = queryKey.join("/");
  
  if (path.includes("/api/platforms")) {
    return mockPlatforms;
  }
  
  if (path.includes("/api/posts")) {
    return mockPosts;
  }
  
  if (path.includes("/api/analytics")) {
    return getMockAnalytics();
  }
  
  return null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // In static mode, simulate API responses for read operations
  if (isStaticMode && method === "GET") {
    const mockData = getMockDataForQuery([url]);
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // In static mode, mutations are not supported
  if (isStaticMode && method !== "GET") {
    console.warn("Static demo mode: Mutations are not supported");
    return new Response(JSON.stringify({ error: "Static demo mode" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // If in static mode, return mock data
    if (isStaticMode) {
      const mockData = getMockDataForQuery(queryKey);
      return mockData as T;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
