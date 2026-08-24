import { KeyRound, LogOut, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { PageHeader } from "@/components/portal/page-header"
import { StatusPill } from "@/components/portal/status-pill"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()

  function logout() {
    clearSession()
    navigate("/login")
  }

  return (
    <div className="space-y-8">
      <PageHeader
        tone="hero"
        eyebrow="Account control"
        title="Settings"
        description="Manage your password and account session."
      />

      <div className="mx-auto max-w-3xl space-y-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <section className="overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-[0_14px_40px_rgba(8,27,69,0.06)]">
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold text-primary">Security</h2>
                <p className="text-xs text-muted-foreground">
                  Protect your alumni account
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-primary">Password</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Change your account password through a secure email reset
                  link.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className={cn(
                  buttonVariants(),
                  "h-11 w-full rounded-xl font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.14)]",
                )}
              >
                Change password
              </Link>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.35rem] border border-border bg-card shadow-[0_14px_40px_rgba(8,27,69,0.06)]">
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e6f7f6] text-[#1e8f97] ring-1 ring-[#bfe9e5] dark:bg-[#1e8f97]/15 dark:text-[#7fe2de] dark:ring-[#1e8f97]/30">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold text-primary">Account</h2>
                <p className="text-xs text-muted-foreground">
                  Session and membership status
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Account status
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Your alumni account is active
                  </p>
                </div>
                <StatusPill variant="success">Active</StatusPill>
              </div>

              <Button
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-rose-200 bg-rose-50/60 font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
