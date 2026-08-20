import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import {
  AuthFieldLabel,
  AuthFlowLayout,
} from "@/components/auth-flow-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError, apiRequest } from "@/lib/api"

export function ForgotPasswordForm() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const form = new FormData(event.currentTarget)
    try {
      const data = await apiRequest<{ message?: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
          }),
        },
      )
      setError("")
      setSuccess(
        data.message ??
          "If an account exists for this email, a password reset link has been sent.",
      )
    } catch (err) {
      setSuccess("")
      setError(
        err instanceof ApiError ? err.message : "Could not send reset email",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFlowLayout
      eyebrow="Account recovery"
      title="Reset password"
      description="Enter your email and we will send a secure reset link. Tokens are never shown on screen."
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <FieldGroup className="gap-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1e8f97] uppercase">
              Forgot password
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-primary">
              Recover access
            </h2>
          </div>

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

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : success ? (
            <p
              className="rounded-xl border border-[#159570]/25 bg-[#159570]/8 px-3 py-2 text-sm text-[#0f6b52]"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="h-11 w-full tracking-wide uppercase"
          >
            {loading ? "Sending…" : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthFlowLayout>
  )
}
