// DO NOT overwrite this file
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { MessageCircleWarningIcon } from "lucide-react";

const alertVariants = cva(
  "flex items-center gap-1.5 w-full rounded-md border p-3  flex items-center",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/3 dark:bg-destructive/20",
        note: "text-amber-700/80 bg-amber-50 border-amber-600/20 [&>svg]:text-amber-600 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  // const injectedChildren = React.Children.map(children, (child) => {
  //   if (React.isValidElement(child)) {
  //     return React.cloneElement(child as React.ReactElement<any>, { variant });
  //   }
  //   return child;
  // });

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { icon?: boolean }
>(({ className, children, icon, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "flex items-center gap-3 text-[13px] leading-none font-medium",
      className,
    )}
    {...props}
  >
    {icon && (
      <div>
        <MessageCircleWarningIcon />
      </div>
    )}
    {children}
  </h5>
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { icon?: boolean }
>(({ className, children, icon, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 text-[13px] leading-snug",
      className,
    )}
    {...props}
  >
    {icon && (
      <div>
        <MessageCircleWarningIcon />
      </div>
    )}
    {children}
  </div>
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
