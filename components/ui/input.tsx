import * as React from "react";
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  startContent?: React.ReactElement;
  endContent?: React.ReactElement;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startContent, endContent, wrapperClassName, ...props }, ref) => {
    const StartContent = startContent;
    const EndContent = endContent;

    return (
      <div className={cn("w-full relative", wrapperClassName)}>
        {StartContent && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {StartContent}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 px-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            startContent ? "pl-8" : "",
            endContent ? "pr-8" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {EndContent && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {EndContent}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
