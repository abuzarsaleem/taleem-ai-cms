import { parseISO } from "date-fns"

import { cn } from "@/lib/utils"

function formatEventDate(isoDate: string) {
  try {
    const date = parseISO(isoDate)
    return {
      month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(date.getDate()).padStart(2, "0"),
    }
  } catch {
    return { month: "—", day: "—" }
  }
}

/** Always renders an image-sized thumb: photo when available, cover placeholder otherwise. */
export function EventThumb({
  imageUrl,
  eventDate,
  title,
  className,
  size = "md",
}: {
  imageUrl?: string | null
  eventDate?: string | null
  title?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClass =
    size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-14"
  const date = eventDate ? formatEventDate(eventDate) : null

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title ?? ""}
        className={cn(
          sizeClass,
          "shrink-0 rounded-md object-cover ring-1 ring-black/5 dark:ring-white/10",
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        sizeClass,
        "relative shrink-0 overflow-hidden rounded-md",
        "bg-[linear-gradient(160deg,oklch(0.42_0.1_245),oklch(0.36_0.07_220))]",
        "ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
      aria-hidden={!title}
      title={title}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,oklch(1_0_0/0.16),transparent_50%)]" />
      {date ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase opacity-85">
            {date.month}
          </span>
          <span className="mt-0.5 text-[17px] font-semibold leading-none tabular-nums">
            {date.day}
          </span>
        </div>
      ) : null}
    </div>
  )
}
