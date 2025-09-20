import { cn } from "@befroosh/lib";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/60", className)}
      {...props}
    />
  );
}
