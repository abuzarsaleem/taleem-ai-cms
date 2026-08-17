import { KeyRound, Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth-page-layout"
import { AuthShell } from "@/components/auth-shell"
import { PasswordField } from "@/components/password-field"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { useConsumeQueryToken } from "@/hooks/use-consume-query-token"
import { ApiError } from "@/lib/api-client"
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
    <AuthPageLayout>
      <AuthShell
        heading="Reset your password"
        description="Use the secure link from your email to choose a new password. The token is never shown on screen."
      >
        {!token ? (
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#0b4d3c]/10 text-[#0b4d3c]">
                <KeyRound className="size-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Link required
              </h1>
              <p className="text-balance text-sm text-muted-foreground">
                Open the reset link from your email to continue. Tokens are not
                entered by hand.
              </p>
            </div>
            <Field>
              <Button
                type="button"
                size="lg"
                className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                onClick={() => navigate("/forgot-password")}
              >
                Request a new link
              </Button>
            </Field>
            <FieldDescription className="text-center">
              <Link to="/login" className="font-medium text-[#0b4d3c]">
                Back to login
              </Link>
            </FieldDescription>
          </FieldGroup>
        ) : (
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#0b4d3c]/10 text-[#0b4d3c]">
                  <KeyRound className="size-5" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Set a new password
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Choose a new password for your alumni account.
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
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                <Link to="/login" className="font-medium text-[#0b4d3c]">
                  Back to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        )}
      </AuthShell>
    </AuthPageLayout>
  )
}
