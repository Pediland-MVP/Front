// hooks/useCopyToClipboard.ts
import { toast } from "@/components/ui/use-toast"; // Import shadcn toast

export const useCopyToClipboard = () => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true
    } catch (err) {
      return false
    }
  };

  return { copyToClipboard };
};