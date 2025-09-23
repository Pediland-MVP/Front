import * as React from "react";
import { Eye, EyeClosed } from "@phosphor-icons/react";
import { cn } from "@befroosh/ui";
import { useLocale } from "next-intl";

interface InputProps extends React.ComponentProps<"input"> {
  iconName?: "Eye" | "EyeClosed";
  messages?: Record<string, string>;
}

const InputPassword = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, iconName = "EyeClosed", messages, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };
    const Icon = isVisible ? Eye : EyeClosed;
    const hasButton = true;
    const locale = useLocale();

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
            className={cn(
              "absolute h-10 w-10 focus:outline-none flex justify-center items-center bg-transparent",
              locale === "fa" ? "left-0" : "right-0"
            )}
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
