import { cn } from "@/lib/utils"

export const RSVP_OPTIONS = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_GOING", label: "Not going" },
] as const

export function rsvpButtonClass(status: string, selected: boolean) {
  if (status === "GOING") {
    return selected
      ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90"
      : "border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
  }
  if (status === "MAYBE") {
    return selected
      ? "border-transparent bg-amber-500 text-white hover:bg-amber-500/90"
      : "border-amber-300 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/40"
  }
  return selected
    ? "border-transparent bg-red-600 text-white hover:bg-red-600/90"
    : "border-red-300 text-red-800 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
}

export function rsvpChipClass(status: string | null) {
  return cn(
    status === "GOING" &&
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    status === "MAYBE" && "bg-amber-500/12 text-amber-800 dark:text-amber-400",
    status === "NOT_GOING" && "bg-red-500/12 text-red-700 dark:text-red-400",
    !status && "bg-primary/10 text-primary",
  )
}
