import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "text-secondary bg-secondary-foreground shadow-sm hover:bg-secondary-foreground/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary p-0 h-auto hover:underline",

        success:
          "bg-green-600 text-destructive-foreground shadow-sm hover:bg-green-600/90",
        icon: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        iconed: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        contact: "text-white",
      },
      size: {
        default: "h-10 px-3 gap-2 [&_svg]:size-5",
        sm: "h-9 px-3 gap-1.5 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 px-5 gap-[10px] text-[15px] [&_svg]:size-6 [&_svg]:-ml-2",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
