import { cn } from "@/lib/utils"

type StatusPillVariant = "success" | "warning" | "info" | "neutral" | "dark"

const variants: Record<StatusPillVariant, string> = {
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  info: "bg-blue-50 text-blue-800",
  neutral: "bg-slate-100 text-slate-600",
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
