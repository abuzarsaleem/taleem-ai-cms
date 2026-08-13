import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

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

export default function ActivatePage() {
  const [params] = useSearchParams()
  const tokenFromQuery = params.get("token") ?? ""
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [loading, setLoading] = useState(false)

  async function onActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      const data = await authService.activate(String(form.get("token") ?? ""))
      setResetToken(data.reset_token)
      setSuccess("Account activated. Set your password to finish.")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Activation failed")
    } finally {
      setLoading(false)
    }
  }

  async function onSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")
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
      setSuccess("Password set. You can sign in now.")
      setResetToken("")
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
      <div className={cn("flex w-full max-w-sm flex-col gap-6")}>
        <Card>
          <CardContent className="pt-6">
            {!resetToken ? (
              <form onSubmit={onActivate}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Activate account</h1>
                    <p className="text-balance text-muted-foreground">
                      Enter the activation token from your approval email
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="token">Activation token</FieldLabel>
                    <Input
                      id="token"
                      name="token"
                      defaultValue={tokenFromQuery}
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
                      {loading ? "Activating…" : "Activate"}
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    Already activated? <Link to="/login">Login</Link>
                  </FieldDescription>
                </FieldGroup>
              </form>
            ) : (
              <form onSubmit={onSetPassword}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Create password</h1>
                    <p className="text-balance text-muted-foreground">
                      Choose a password for your alumni account
                    </p>
                  </div>
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
                      {loading ? "Saving…" : "Set password"}
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    <Link to="/login">Go to login</Link>
                  </FieldDescription>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>

        {!resetToken ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onResend}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-lg font-semibold">
                      Resend activation email
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t get the email? Request another link
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" required />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      Resend
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AuthPageLayout>
  )
}
