import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StaticModeBanner() {
  // Check if we're in static mode (GitHub Pages)
  // Use endsWith to prevent URL substring attacks
  const isGitHubPages = window.location.hostname.endsWith('.github.io') || 
                        window.location.hostname === 'github.io';
  
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
