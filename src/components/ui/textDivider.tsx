import { FC } from "react";


export interface TextDividerProps {
    children: React.ReactElement | string
    className?: string
    size?: "sm" | "md" | 'lg'
}
const TextDivider: FC<TextDividerProps> = ({ children, className, size = "md" }) => {
  return (
    <div className={`relative ${size === "sm" ? "my-1" : size === "md" ? "my-2" : "my-3"} ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t"/>
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  );
};

export default TextDivider