import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "placeholder:text-muted-foreground focus-visible:border-label flex min-h-14 w-full rounded-lg border bg-white px-3 py-1.5 text-sm duration-300 outline-none disabled:cursor-not-allowed disabled:bg-white/90 disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
