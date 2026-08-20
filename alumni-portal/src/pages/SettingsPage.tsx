import { KeyRound, LogOut, ShieldCheck } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
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
    <div className="relative mx-auto max-w-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden rounded-[1.5rem] opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(54,186,188,0.14),transparent_55%),radial-gradient(ellipse_at_top_left,rgba(8,27,69,0.07),transparent_50%)]" />
      </div>

      <div className="relative space-y-8 px-5 pt-5 sm:px-6 sm:pt-6">
        <header className="max-w-xl">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#1e8f97] uppercase">
            Account control
          </p>
          <h1 className="mt-2.5 font-display text-[2rem] leading-[1.15] font-semibold tracking-tight text-primary sm:text-[2.2rem]">
            Settings
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Manage your password and account session.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="overflow-hidden rounded-[1.35rem] border border-[#e6ecf4] bg-white shadow-[0_14px_40px_rgba(8,27,69,0.06)]">
            <div className="flex items-center gap-3 border-b border-[#eef2f7] bg-[#f8fafc] px-5 py-4">
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

          <section className="overflow-hidden rounded-[1.35rem] border border-[#e6ecf4] bg-white shadow-[0_14px_40px_rgba(8,27,69,0.06)]">
            <div className="flex items-center gap-3 border-b border-[#eef2f7] bg-[#f8fafc] px-5 py-4">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e6f7f6] text-[#1e8f97] ring-1 ring-[#bfe9e5]">
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
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eef2f7] bg-[#f8fafc] px-4 py-3.5">
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
                className="h-11 w-full gap-2 rounded-xl border-rose-200 bg-rose-50/60 font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800"
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
