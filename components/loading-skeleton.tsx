import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  rows?: number
  showHeader?: boolean
}

export function LoadingSkeleton({ className, rows = 3, showHeader = true }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
