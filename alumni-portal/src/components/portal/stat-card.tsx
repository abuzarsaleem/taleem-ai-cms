import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  action?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  action,
  className,
}: StatCardProps) {
  return (
    <div className={cn("portal-card p-5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-[1.75rem] leading-none font-extrabold tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
