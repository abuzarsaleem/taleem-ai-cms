import { AuthPageLayout } from "@/components/auth-page-layout"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </AuthPageLayout>
  )
}
