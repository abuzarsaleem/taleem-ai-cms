import { MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/theme/ThemeProvider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className={className}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-1.5 shadow-sm backdrop-blur">
        <SunIcon className="size-4 text-muted-foreground" />
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          aria-label="Toggle dark mode"
        />
        <MoonIcon className="size-4 text-muted-foreground" />
        <Label htmlFor="theme-toggle" className="sr-only">
          Dark mode
        </Label>
      </div>
    </div>
  )
}
