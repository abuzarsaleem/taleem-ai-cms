import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  AuthFieldLabel,
  AuthFlowLayout,
} from "@/components/auth-flow-layout"
import { PasswordField } from "@/components/password-field"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useConsumeQueryToken } from "@/hooks/use-consume-query-token"
import { ApiError } from "@/lib/api-client"
import { validatePasswordStrength } from "@/lib/password-rules"
import { authService } from "@/services/auth.service"

const PENDING_RESET_KEY = "taleem_activation_reset"
const inflightActivations = new Map<
  string,
  ReturnType<typeof authService.activate>
>()

function activateOnce(token: string) {
  const existing = inflightActivations.get(token)
  if (existing) return existing
  const request = authService.activate(token)
  inflightActivations.set(token, request)
  return request
}

type View = "verifying" | "need-link" | "set-password" | "error"

function readPendingResetToken() {
  try {
    return sessionStorage.getItem(PENDING_RESET_KEY) ?? ""
  } catch {
    return ""
  }
}

export default function ActivatePage() {
  const navigate = useNavigate()
  const token = useConsumeQueryToken("taleem_activation_link")
  const startedRef = useRef(false)
  const pendingReset = readPendingResetToken()
  const [view, setView] = useState<View>(
    token ? "verifying" : pendingReset ? "set-password" : "need-link",
  )
  const [resetToken, setResetToken] = useState(pendingReset)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || startedRef.current) return
    startedRef.current = true

    let cancelled = false

    async function activateFromLink() {
      try {
        const data = await activateOnce(token)
        if (cancelled) return
        sessionStorage.setItem(PENDING_RESET_KEY, data.reset_token)
        sessionStorage.removeItem("taleem_activation_link")
        setResetToken(data.reset_token)
        setView("set-password")
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof ApiError
            ? err.message
            : "This activation link is invalid or has expired."
        setError(message)
        setView("error")
      }
    }

    void activateFromLink()
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")
    if (password !== confirm) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    const strengthError = validatePasswordStrength(password)
    if (strengthError) {
      setError(strengthError)
      setLoading(false)
      return
    }
    try {
      await authService.resetPassword({
        token: resetToken,
        password,
      })
      sessionStorage.removeItem(PENDING_RESET_KEY)
      navigate("/login", {
        replace: true,
        state: { notice: "Password set. You can sign in now." },
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  async function onResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      await authService.resendActivation(String(form.get("email") ?? ""))
      setSuccess("If eligible, a new activation email has been sent.")
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not resend activation",
      )
    } finally {
      setLoading(false)
    }
  }

  const sidebarExtra =
    view === "set-password" ? (
      <>
        <div className="flex items-center gap-3 rounded-xl border border-[#159570]/30 bg-[#159570]/8 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-[#159570]" />
          <div>
            <p className="text-sm font-semibold text-[#0f6b52]">
              Registration Approved
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your alumni request cleared verification.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Activation reference
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-primary">
            Ready to set password
          </p>
        </div>
      </>
    ) : null

  return (
    <AuthFlowLayout
      eyebrow="Account Activation"
      title="Set Your Password"
      description="Open the secure link from your approval email. We never ask you to paste a token."
      steps={[
        { id: "register", label: "Register", done: true },
        { id: "confirm", label: "Confirmation", done: true },
        { id: "activate", label: "Activation" },
      ]}
      activeStepId="activate"
      sidebarExtra={sidebarExtra}
    >
      {view === "verifying" ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <h2 className="font-display text-xl font-semibold text-primary">
            Verifying your link
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we activate your account.
          </p>
        </div>
      ) : null}

      {view === "set-password" ? (
        <form onSubmit={onSetPassword} className="mx-auto w-full max-w-md">
          <FieldGroup className="gap-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1e8f97] uppercase">
                Create password
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-primary">
                Create Password
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Account verified. Choose a password to finish setup.
              </p>
            </div>
            <PasswordField
              id="password"
              name="password"
              label="Password"
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm_password"
              name="confirm_password"
              label="Confirm password"
              autoComplete="new-password"
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Field>
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full tracking-wide uppercase"
                disabled={loading}
              >
                {loading ? "Saving…" : "Activate Account"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : null}

      {view === "need-link" || view === "error" ? (
        <form onSubmit={onResend} className="mx-auto w-full max-w-md">
          <FieldGroup className="gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-primary">
                Activate account
              </h2>
              <p
                className={
                  error && !error.toLowerCase().includes("already activated")
                    ? "text-sm text-destructive"
                    : "text-sm text-muted-foreground"
                }
              >
                {error && error.toLowerCase().includes("already activated")
                  ? "This account is already active. Sign in to continue."
                  : error
                    ? error
                    : view === "error"
                      ? "This link is invalid or expired. Request a new activation email."
                      : "Use the activation link in your approval email. If you need a new one, enter your email below."}
              </p>
            </div>
            {success && !error ? (
              <p
                className="rounded-xl border border-[#159570]/25 bg-[#159570]/8 px-3 py-2 text-sm text-[#0f6b52]"
                role="status"
              >
                {success}
              </p>
            ) : null}
            {error && error.toLowerCase().includes("already activated") ? (
              <Field>
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full tracking-wide uppercase"
                  onClick={() => navigate("/login")}
                >
                  Go to login
                </Button>
              </Field>
            ) : (
              <>
                <Field>
                  <AuthFieldLabel htmlFor="email">Email</AuthFieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11"
                  />
                </Field>
                <Field>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 w-full tracking-wide uppercase"
                    disabled={loading}
                  >
                    {loading ? "Sending…" : "Resend activation email"}
                  </Button>
                </Field>
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Already activated?{" "}
              <Link to="/login" className="font-semibold text-primary">
                Login
              </Link>
            </p>
          </FieldGroup>
        </form>
      ) : null}
    </AuthFlowLayout>
  )
}
