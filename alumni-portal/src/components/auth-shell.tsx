import type { ReactNode } from "react"

import { AuthBrandPanel } from "@/components/auth-brand-panel"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  children: ReactNode
  heading?: string
  description?: string
  className?: string
}

export function AuthShell({
  children,
  heading,
  description,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("w-full max-w-sm md:max-w-4xl", className)}>
      <Card className="overflow-hidden p-0 shadow-xl ring-foreground/8">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">{children}</div>
          <AuthBrandPanel heading={heading} description={description} />
        </CardContent>
      </Card>
    </div>
  )
}
