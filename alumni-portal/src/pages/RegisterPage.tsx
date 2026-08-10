import { AuthPageLayout } from "@/components/auth-page-layout"
import { SignupForm } from "@/components/signup-form"

export default function RegisterPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm md:max-w-6xl">
        <SignupForm />
      </div>
    </AuthPageLayout>
  )
}
