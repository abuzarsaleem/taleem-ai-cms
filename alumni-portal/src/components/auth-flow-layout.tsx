import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ShieldCheck, Sparkles } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export type AuthFlowStep = {
  id: string
  label: string
  done?: boolean
}

type AuthFlowLayoutProps = {
  children: ReactNode
  eyebrow?: string
  title: string
  description?: string
  steps?: AuthFlowStep[]
  activeStepId?: string
  onStepSelect?: (stepId: string) => void
  sidebarExtra?: ReactNode
  className?: string
  contentClassName?: string
  /** Centered single-column (confirmation / success) */
  centered?: boolean
}

/** Split onboarding shell — mockup layout, Dashboard blue/white colors. */
export function AuthFlowLayout({
  children,
  eyebrow,
  title,
  description,
  steps,
  activeStepId,
  onStepSelect,
  sidebarExtra,
  className,
  contentClassName,
  centered = false,
}: AuthFlowLayoutProps) {
  if (centered) {
    return (
      <div
        className={cn(
          "relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#f6f8fb] px-4 py-10 dark:bg-background",
          className,
        )}
      >
        <Atmosphere />
        <Link to="/login" className="absolute top-5 left-5 z-10 md:top-8 md:left-8">
          <BrandLogo className="h-9 md:h-10" />
        </Link>
        <ThemeToggle className="absolute top-5 right-5 z-10 md:top-8 md:right-8" />
        <div className={cn("relative z-10 w-full max-w-lg", contentClassName)}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative min-h-svh bg-[#f6f8fb] dark:bg-background",
        className,
      )}
    >
      <Atmosphere />
      <ThemeToggle className="absolute top-4 right-4 z-30 md:top-6 md:right-6" />

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-[1280px] lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="relative z-10 flex flex-col border-b border-border bg-white px-6 py-8 sm:px-8 lg:border-r lg:border-b-0 lg:py-10 dark:bg-card">
          <Link to="/login" className="mb-10 inline-flex w-fit">
            <BrandLogo className="h-9" />
          </Link>

          {eyebrow ? (
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-accent-foreground uppercase">
              <span className="text-[#1e8f97]">{eyebrow}</span>
            </p>
          ) : null}
          <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight text-primary sm:text-[2.15rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}

          {steps && steps.length > 0 ? (
            <ol className="mt-10 space-y-2.5">
              {steps.map((step, index) => {
                const active = step.id === activeStepId
                const clickable = Boolean(onStepSelect)
                return (
                  <li key={step.id}>
                    {clickable ? (
                      <button
                        type="button"
                        onClick={() => onStepSelect?.(step.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors",
                          active
                            ? "border-primary/25 bg-primary/[0.04] text-primary shadow-sm"
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.done
                                ? "border-[#159570] text-[#159570]"
                                : "border-border bg-muted/40",
                          )}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={cn(active && "font-semibold")}>
                          {step.label}
                        </span>
                      </button>
                    ) : (
                      <div
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors",
                          active
                            ? "border-primary/25 bg-primary/[0.04] text-primary shadow-sm"
                            : "border-transparent text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : step.done
                                ? "border-[#159570] text-[#159570]"
                                : "border-border bg-muted/40",
                          )}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={cn(active && "font-semibold")}>
                          {step.label}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          ) : null}

          {sidebarExtra ? (
            <div className="mt-8 space-y-3">{sidebarExtra}</div>
          ) : null}

          <div className="mt-auto hidden pt-10 lg:block">
            <div className="rounded-xl border border-border bg-[#f6f8fb] p-4 dark:bg-muted/40">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[#1e8f97]" />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    AI Assist
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Keep details accurate — verified records unlock your Digital
                    Alumni ID faster.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-[#1e8f97]" />
              Secure alumni verification
            </p>
          </div>
        </aside>

        <section
          className={cn(
            "relative z-20 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-12",
            contentClassName,
          )}
        >
          {children}
        </section>
      </div>
    </div>
  )
}

function Atmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(70% 50% at 0% 0%, rgba(8,27,69,0.06), transparent 55%), radial-gradient(55% 45% at 100% 100%, rgba(54,186,188,0.12), transparent 50%)",
      }}
    />
  )
}

export function AuthFieldLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-2 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </label>
  )
}
