import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

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
      setSuccess(
        data.message ??
          "If an account exists for that email, a reset link has been sent.",
      )
      event.currentTarget.reset()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not send reset email",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Forgot password</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your email and we&apos;ll send a reset link
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm text-primary" role="status">
                  {success}
                </p>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Remembered your password? <Link to="/login">Login</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
