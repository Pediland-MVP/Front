import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { IconProps } from "@phosphor-icons/react";
import { X } from "@phosphor-icons/react/dist/ssr";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary hover:bg-primary/90 text-primary-foreground shadow",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        success:
          "bg-green-600 text-destructive-foreground shadow-sm hover:bg-green-600/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        icon: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        iconed: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline: "bg-gray-200 hover:bg-gray-200/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary hover:text-secondary gap-1 px-1",
        contact: "text-white",
      },
      size: {
        sm: "h-8 sm:h-9 rounded px-2 sm:px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-14 rounded-lg px-7 text-md",
      },
      iconSize: {
        sm: "w-4 h-4",
        default: "w-5 h-5",
        lg: "w-6 h-6",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      iconSize: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ComponentType<IconProps>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon: Icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        dir="rtl"
        {...props}
      >
        <X size={20} weight="bold" />
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
