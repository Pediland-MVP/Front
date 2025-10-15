"use client";

import { useGlobalLoading } from "@/components/Providers/GlobalLoadingProvider";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { Button } from "@/components/ui/button";

/**
 * Example component showing how to use the integrated loading system
 * This is for demonstration purposes - you can remove this file if not needed
 */
export const LoadingExample = () => {
  const { setLoading, showLoadingFor } = useGlobalLoading();
  const { navigateWithLoading, showLoadingForDuration } = useNavigationLoading();

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Loading System Examples</h3>
      
      <div className="space-y-2">
        <Button 
          onClick={() => showLoadingFor(2000)}
          variant="outline"
        >
          Show Loading for 2 seconds
        </Button>
        
        <Button 
          onClick={() => setLoading(true)}
          variant="outline"
        >
          Show Loading (Manual)
        </Button>
        
        <Button 
          onClick={() => setLoading(false)}
          variant="outline"
        >
          Hide Loading (Manual)
        </Button>
        
        <Button 
          onClick={() => navigateWithLoading("/auth")}
          variant="outline"
        >
          Navigate to Auth with Loading
        </Button>
        
        <Button 
          onClick={() => showLoadingForDuration(1500)}
          variant="outline"
        >
          Show Loading for 1.5 seconds (Hook)
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Use these patterns in your components:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><code>setLoading(true/false)</code> - Manual control</li>
          <li><code>showLoadingFor(duration)</code> - Timed loading</li>
          <li><code>navigateWithLoading(url)</code> - Loading during navigation</li>
        </ul>
      </div>
    </div>
  );
};
