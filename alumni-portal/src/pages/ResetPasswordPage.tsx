import { KeyRound, Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthFlowLayout } from "@/components/auth-flow-layout"
import { PasswordField } from "@/components/password-field"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { useConsumeQueryToken } from "@/hooks/use-consume-query-token"
import { ApiError } from "@/lib/api-client"
import { validatePasswordStrength } from "@/lib/password-rules"
import { authService } from "@/services/auth.service"

const RESET_TOKEN_KEY = "taleem_password_reset"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = useConsumeQueryToken(RESET_TOKEN_KEY)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")

    if (!token) {
      setError("This reset link is missing or expired. Request a new one.")
      setLoading(false)
      return
    }

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
      await authService.resetPassword({ token, password })
      sessionStorage.removeItem(RESET_TOKEN_KEY)
      navigate("/login", {
        replace: true,
        state: { notice: "Password updated. You can sign in now." },
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFlowLayout
      eyebrow="Password reset"
      title="Set a new password"
      description="Use the secure link from your email. The token is never shown on screen."
    >
      {!token ? (
        <FieldGroup className="mx-auto w-full max-w-md gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-primary">
              Link required
            </h2>
            <p className="text-sm text-muted-foreground">
              Open the reset link from your email to continue.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-11 w-full tracking-wide uppercase"
            onClick={() => navigate("/forgot-password")}
          >
            Request a new link
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary">
              Back to login
            </Link>
          </p>
        </FieldGroup>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
          <FieldGroup className="gap-5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1e8f97] uppercase">
                New credentials
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-primary">
                Choose password
              </h2>
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
                className="h-11 w-full tracking-wide uppercase"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2 normal-case tracking-normal">
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Update password"
                )}
              </Button>
            </Field>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-semibold text-primary">
                Back to login
              </Link>
            </p>
          </FieldGroup>
        </form>
      )}
    </AuthFlowLayout>
  )
}
