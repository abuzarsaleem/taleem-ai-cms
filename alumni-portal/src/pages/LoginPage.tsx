import { AuthPageLayout } from "@/components/auth-page-layout"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </AuthPageLayout>
  )
}
