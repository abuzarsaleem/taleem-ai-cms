import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { AuthFieldLabel } from "@/components/auth-flow-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PASSWORD_HINT } from "@/lib/password-rules"

type PasswordFieldProps = {
  id: string
  name: string
  label: string
  autoComplete?: string
  minLength?: number
}

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength = 8,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <Field>
      <AuthFieldLabel htmlFor={id}>{label}</AuthFieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className="h-11 pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      <FieldDescription>{PASSWORD_HINT}</FieldDescription>
    </Field>
  )
}
