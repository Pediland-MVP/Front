import * as React from "react";
import { EyeClosed, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  iconName?: "EyeClosed" | "EyeSlash";
}

const InputPassword = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, iconName = "EyeSlash", ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    const Icon = isVisible ? EyeClosed : EyeSlash;
    const hasButton = true;

    return (
      <div className="flex items-center group relative">
        <input
          type={isVisible ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-lg border-2 border-input bg-white px-3 py-1 text-base shadow-sm transition-colors outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasButton && (
          <button
            type="button"
            className="absolute left-0 h-10 w-10 focus:outline-none flex justify-center items-center bg-transparent"
            onClick={toggleVisibility}
          >
            <Icon
              size={20}
              className="text-gray-400 hover:text-gray-600 duration-200"
            />
          </button>
        )}
      </div>
    );
  }
);

InputPassword.displayName = "InputPassword";

export { InputPassword };
