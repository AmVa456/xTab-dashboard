import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StaticModeBanner() {
  // Check if we're likely in static mode (GitHub Pages)
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  if (!isGitHubPages) {
    return null;
  }

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm text-blue-800">
        <strong>Demo Mode:</strong> You're viewing a static demo of xTab Dashboard with sample data.
        For full functionality with backend support, please see the{" "}
        <a 
          href="https://github.com/AmVa456/xTab-dasboard#readme" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline font-medium hover:text-blue-900"
        >
          deployment documentation
        </a>.
      </AlertDescription>
    </Alert>
  );
}
