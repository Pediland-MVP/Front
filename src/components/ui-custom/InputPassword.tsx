// Refactored
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import * as React from "react";

import { Input } from "@/components";
import { EyeClosedIcon, EyeIcon } from "@phosphor-icons/react/dist/ssr";

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
    const Icon = isVisible ? EyeIcon : EyeClosedIcon;
    const hasButton = true;
    const locale = useLocale();

    return (
      <div className="group relative flex items-center">
        <Input
          type={isVisible ? "text" : "password"}
          className={cn(className)}
          ref={ref}
          {...props}
        />
        {hasButton && (
          <button
            type="button"
            className={cn(
              "absolute flex h-10 w-10 items-center justify-center bg-transparent focus:outline-none",
              locale === "fa" ? "left-0" : "right-0",
            )}
            onClick={toggleVisibility}
          >
            <Icon
              size={20}
              className="text-gray-400 duration-200 hover:text-gray-600"
            />
          </button>
        )}
      </div>
    );
  },
);

InputPassword.displayName = "InputPassword";

export { InputPassword };
