import { cn } from "@/lib/utils"

type StatusPillVariant =
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "danger"
  | "dark"

const variants: Record<StatusPillVariant, string> = {
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  info: "bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  neutral:
    "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  dark: "bg-white/12 text-slate-100",
}

export function StatusPill({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode
  variant?: StatusPillVariant
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
