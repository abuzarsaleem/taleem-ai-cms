import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/AuthContext"
import {
  AuthFieldLabel,
  AuthFlowLayout,
} from "@/components/auth-flow-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { authService } from "@/services/auth.service"

export function LoginForm() {
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
    <AuthFlowLayout
      eyebrow="Alumni Portal"
      title="Welcome back"
      description="Sign in to your verified alumni identity, Digital ID, and community."
    >
      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
        <FieldGroup className="gap-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1e8f97] uppercase">
              Sign in
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-primary">
              Account access
            </h2>
          </div>

          {notice && !error ? (
            <p
              className="rounded-xl border border-[#159570]/25 bg-[#159570]/8 px-3 py-2 text-sm text-[#0f6b52]"
              role="status"
            >
              {notice}
            </p>
          ) : null}

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
            <div className="mb-2 flex items-center justify-between gap-3">
              <AuthFieldLabel htmlFor="password" className="mb-0">
                Password
              </AuthFieldLabel>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="h-11"
            />
          </Field>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={loading} className="h-11 w-full tracking-wide uppercase">
            {loading ? "Signing in…" : "Login"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-primary">
              Register
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthFlowLayout>
  )
}
