import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse theme-rounded bg-primary-100/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
