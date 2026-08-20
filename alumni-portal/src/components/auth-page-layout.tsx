import type { ReactNode } from "react"

import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#f6f8fb] p-6 md:p-10 dark:bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-40"
        style={{
          background:
            "radial-gradient(70% 50% at 50% -10%, rgba(8,27,69,0.10), transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(54,186,188,0.14), transparent 55%)",
        }}
      />
      <BrandLogo className="absolute top-4 left-4 z-10 h-9 md:top-6 md:left-6 md:h-11" />
      <ThemeToggle className="absolute top-4 right-4 z-10 md:top-6 md:right-6" />
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  )
}
