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
    const hasButton = true; // Assume button is always available, you can change this logic as needed

    return (
      <div className="flex items-center border rounded-md group">
        <input
          type={isVisible ? "text" : "password"}
          className={cn(
            "flex-1 h-9 rounded-md bg-white px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground   disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border focus-visible:border-black focus-visible:outline-none focus-visible:border-l-0",
            hasButton ? "rounded-tl-none rounded-bl-none" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasButton && (
          <button
            type="button"
            className="h-9 w-9 focus:outline-none flex justify-center items-center bg-white rounded-tl-md rounded-bl-md group-focus-within:ring-1 group-focus-within:ring-black group-focus-within:ring-right-red-400"
            onClick={toggleVisibility}
          >
            <Icon size={20} className="text-gray-400" />
          </button>
        )}
      </div>
    );
  }
);

InputPassword.displayName = "InputPassword";

export { InputPassword };
