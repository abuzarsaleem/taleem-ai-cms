import { KeyRound, LogOut, ShieldCheck } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { PageHeader } from "@/components/portal/page-header"
import { StatusPill } from "@/components/portal/status-pill"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-client"
import { authService } from "@/services/auth.service"
import { profileService } from "@/services/profile.service"

export function SettingsPage() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let cancelled = false
    void profileService
      .getMyProfile()
      .then((profile) => {
        if (!cancelled && profile.email) setEmail(profile.email)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function logout() {
    clearSession()
    navigate("/login")
  }

  function openPasswordDialog() {
    setError("")
    setSuccess("")
    setPasswordOpen(true)
  }

  async function onSendReset(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError("Enter your account email")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const result = await authService.forgotPassword(trimmed)
      setSuccess(
        result.message ??
          "If an account exists for this email, a password reset link has been sent.",
      )
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not send reset email",
      )
    } finally {
      setLoading(false)
    }
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
              <Button
                type="button"
                className="h-11 w-full rounded-xl font-semibold shadow-[0_10px_22px_rgba(8,27,69,0.14)]"
                onClick={openPasswordDialog}
              >
                Change password
              </Button>
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

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md"
        >
          <form onSubmit={(event) => void onSendReset(event)}>
            <div className="space-y-1.5 px-5 pt-5">
              <DialogTitle className="text-lg font-semibold text-foreground">
                Change password
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Enter your account email and we&apos;ll send a secure reset
                link.
              </DialogDescription>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label
                  htmlFor="settings-reset-email"
                  className="text-sm font-semibold text-foreground"
                >
                  Email
                </label>
                <Input
                  id="settings-reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 h-11"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p
                  className="rounded-xl border border-[#159570]/25 bg-[#159570]/8 px-3 py-2 text-sm text-[#0f6b52]"
                  role="status"
                >
                  {success}
                </p>
              ) : null}
            </div>

            <DialogFooter className="border-t border-border px-5 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
