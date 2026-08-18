import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { AuthBrandPanel } from "@/components/auth-brand-panel"
import { cn } from "@/lib/utils"
import { ApiError, apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
      const data = await apiRequest<{ message?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
        }),
      })
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-xl ring-foreground/8">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Forgot password
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send a secure reset link
                </p>
              </div>
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
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : success ? (
                <p className="text-sm text-[#0b4d3c]" role="status">
                  {success}
                </p>
              ) : null}
              <Field>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Remembered your password?{" "}
                <Link to="/login" className="font-medium text-[#0b4d3c]">
                  Login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <AuthBrandPanel
            heading="Recover access securely"
            description="Reset links expire automatically. We never ask you to paste a token into the page."
          />
        </CardContent>
      </Card>
    </div>
  )
}
