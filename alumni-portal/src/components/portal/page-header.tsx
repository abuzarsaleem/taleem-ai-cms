import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-bold tracking-[0.16em] text-accent uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "font-display text-[1.85rem] leading-[1.15] font-semibold tracking-tight sm:text-[2.1rem]",
            eyebrow ? "mt-2.5" : "mt-0",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex shrink-0 flex-wrap items-center gap-2.5",
            eyebrow && "sm:mt-8",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}
