import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function PageLoader({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[16rem] flex-col items-center justify-center gap-3 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  )
}
