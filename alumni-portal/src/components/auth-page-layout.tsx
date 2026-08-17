import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#f4f1ea] p-6 md:p-10 dark:bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
        style={{
          background:
            "radial-gradient(70% 50% at 50% -10%, rgba(11,77,60,0.12), transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(201,162,39,0.12), transparent 55%)",
        }}
      />
      <ThemeToggle className="absolute top-4 right-4 z-10 md:top-6 md:right-6" />
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  )
}
