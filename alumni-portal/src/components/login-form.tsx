import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import { AuthBrandPanel } from "@/components/auth-brand-panel"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const notice =
    typeof location.state === "object" &&
    location.state &&
    "notice" in location.state
      ? String((location.state as { notice?: string }).notice ?? "")
      : ""

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(event.currentTarget)
    try {
      const data = await authService.login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      })

      setSession({
        token: data.access_token,
        userId: data.user_id,
        role: data.role,
      })
      navigate("/home")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed")
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
                  Welcome back
                </h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Sign in to your Taleem Alumni account
                </p>
              </div>
              {notice ? (
                <p
                  className="rounded-lg bg-[#0b4d3c]/8 px-3 py-2 text-center text-sm text-[#0b4d3c]"
                  role="status"
                >
                  {notice}
                </p>
              ) : null}
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto text-sm text-[#0b4d3c] underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-10"
                />
              </Field>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-[#0b4d3c] hover:bg-[#0b4d3c]/90"
                >
                  {loading ? "Signing in…" : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-medium text-[#0b4d3c]">
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <AuthBrandPanel />
        </CardContent>
      </Card>
    </div>
  )
}
