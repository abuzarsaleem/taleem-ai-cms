import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { AuthPageLayout } from "@/components/auth-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-client"
import { authService } from "@/services/auth.service"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tokenFromQuery = params.get("token") ?? ""
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")
    const token = String(form.get("token") ?? "")

    if (password !== confirm) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      await authService.resetPassword({ token, password })
      setSuccess("Password updated. You can sign in now.")
      setTimeout(() => navigate("/login"), 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageLayout>
      <div className={cn("w-full max-w-sm")}>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Set a new password</h1>
                  <p className="text-balance text-muted-foreground">
                    Use the token from your email to create a new password
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="token">Reset token</FieldLabel>
                  <Input
                    id="token"
                    name="token"
                    defaultValue={tokenFromQuery}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">New password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm_password">
                    Confirm password
                  </FieldLabel>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    minLength={8}
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
                    {loading ? "Saving…" : "Update password"}
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  <Link to="/login">Back to login</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  )
}
