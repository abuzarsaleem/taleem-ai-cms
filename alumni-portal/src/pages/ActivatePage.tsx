import { CheckCircle2, Loader2, Mail } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth-page-layout"
import { AuthShell } from "@/components/auth-shell"
import { PasswordField } from "@/components/password-field"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useConsumeQueryToken } from "@/hooks/use-consume-query-token"
import { ApiError } from "@/lib/api-client"
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

  return (
    <AuthPageLayout>
      <AuthShell
        heading="Activate your alumni identity"
        description="Open the secure link from your approval email. We never ask you to paste a token."
      >
        {view === "verifying" ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-[#0b4d3c]" />
            <h1 className="text-xl font-semibold tracking-tight">
              Verifying your link
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we activate your account.
            </p>
          </div>
        ) : null}

        {view === "set-password" ? (
          <form onSubmit={onSetPassword}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#0b4d3c]/10 text-[#0b4d3c]">
                  <CheckCircle2 className="size-5" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Create password
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Account verified. Choose a password to finish setup.
                </p>
              </div>
              <PasswordField
                id="password"
                name="password"
                label="New password"
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
                  className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Set password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        ) : null}

        {view === "need-link" || view === "error" ? (
          <form onSubmit={onResend}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#0b4d3c]/10 text-[#0b4d3c]">
                  <Mail className="size-5" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Activate account
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  {error.toLowerCase().includes("already activated")
                    ? "This account is already active. Sign in to continue."
                    : view === "error"
                      ? "This link is invalid or expired. Request a new activation email."
                      : "Use the activation link in your approval email. If you need a new one, enter your email below."}
                </p>
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm text-[#0b4d3c]" role="status">
                  {success}
                </p>
              ) : null}
              {error &&
              error.toLowerCase().includes("already activated") ? (
                <Field>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                    onClick={() => navigate("/login")}
                  >
                    Go to login
                  </Button>
                </Field>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="h-10"
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                      disabled={loading}
                    >
                      {loading ? "Sending…" : "Resend activation email"}
                    </Button>
                  </Field>
                </>
              )}
              <FieldDescription className="text-center">
                Already activated?{" "}
                <Link to="/login" className="font-medium text-[#0b4d3c]">
                  Login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        ) : null}
      </AuthShell>
    </AuthPageLayout>
  )
}
