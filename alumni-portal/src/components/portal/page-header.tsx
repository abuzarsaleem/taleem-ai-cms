import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  tone?: "default" | "hero"
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  tone = "default",
}: PageHeaderProps) {
  const isHero = tone === "hero"

  return (
    <header
      className={cn(
        isHero
          ? "portal-hero relative overflow-hidden rounded-3xl p-8 text-white shadow-[var(--portal-shadow)] sm:p-10"
          : "mb-8 sm:mb-10",
        className,
      )}
    >
      {isHero ? (
        <>
          <div
            aria-hidden
            className="absolute -top-16 -right-10 size-56 rounded-full border border-white/10"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 left-1/3 size-64 rounded-full bg-[#36babc]/15 blur-2xl"
          />
        </>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
          isHero && "relative",
        )}
      >
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-bold tracking-[0.18em] uppercase",
                isHero ? "text-[#7fe2de]" : "text-accent",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-display font-semibold tracking-tight",
              isHero
                ? "text-[2.15rem] leading-[1.12] sm:text-[2.5rem]"
                : "text-[2rem] leading-[1.15] sm:text-[2.2rem]",
              isHero ? "text-white" : "text-foreground",
              eyebrow ? "mt-2.5" : "mt-0",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "mt-3 max-w-2xl text-[15px] leading-relaxed",
                isHero ? "text-[#c8d5ed]" : "text-muted-foreground",
              )}
            >
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
    </header>
  )
}
