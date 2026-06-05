import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LogoTextProps {
  className?: string;
  variant?: "default" | "white";
  size?: "default" | "sm" | "md";
}

export const LogoText = ({
  className,
  variant = "default",
  size = "default",
}: LogoTextProps) => {
  const t = useTranslations("Components.LogoText");

  return (
    <h2
      className={cn(
        "text-gradient text-2xl font-extrabold",
        size === "sm" && "text-lg font-bold",
        size === "md" && "text-xl font-bold",
        variant === "white" && "text-white",
        className,
      )}
    >
      {t("title")}
    </h2>
  );
};
