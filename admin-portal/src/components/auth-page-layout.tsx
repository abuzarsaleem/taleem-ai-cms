import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <ThemeToggle className="absolute top-4 right-4 z-10 md:top-6 md:right-6" />
      {children}
    </div>
  )
}
