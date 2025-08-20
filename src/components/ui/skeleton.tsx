import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse h-5 w-1/2", className)}
      {...props}
    />
  )
}

export { Skeleton }
