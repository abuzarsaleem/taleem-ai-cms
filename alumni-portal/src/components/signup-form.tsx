import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEGREE_PROGRAMS = [
  { id: "prog-bs-cs-isb", label: "BS Computer Science — Islamabad" },
  { id: "prog-bs-se-isb", label: "BS Software Engineering — Islamabad" },
  { id: "prog-bs-ai-lhr", label: "BS Artificial Intelligence — Lahore" },
  { id: "prog-bs-ds-khi", label: "BS Data Science — Karachi" },
  { id: "prog-ms-cs-isb", label: "MS Computer Science — Islamabad" },
  { id: "prog-mba-isb", label: "MBA — Islamabad" },
  { id: "prog-bba-lhr", label: "BBA Business Administration — Lahore" },
  { id: "prog-bs-ee-khi", label: "BS Electrical Engineering — Karachi" },
]

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [photoName, setPhotoName] = useState("")
  const [degreeProgramId, setDegreeProgramId] = useState("")

  function onPhotoChange(file: File | null) {
    setError("")
    setPhotoName(file?.name ?? "")
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!degreeProgramId) {
      setError("Please select a degree program")
      return
    }

    setLoading(true)

    // UI-only for now — API wiring comes later
    window.setTimeout(() => {
      setSuccess("Registration details captured. API submission is disabled for now.")
      event.currentTarget.reset()
      setDegreeProgramId("")
      setPhotoName("")
      setLoading(false)
    }, 400)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Register for Taleem Alumni verification
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="full_name">Full name</FieldLabel>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Ali Khan"
                    required
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone_number">Phone number</FieldLabel>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="03XXXXXXXXX"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="whatsapp_number">WhatsApp number</FieldLabel>
                  <Input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    type="tel"
                    placeholder="03XXXXXXXXX"
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="cnic_national_id">CNIC / National ID</FieldLabel>
                  <Input
                    id="cnic_national_id"
                    name="cnic_national_id"
                    placeholder="35202-1234567-1"
                    pattern="\d{5}-\d{7}-\d"
                    title="Format: #####-#######-#"
                    required
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="degree_program_id">Degree program</FieldLabel>
                  <Select
                    value={degreeProgramId}
                    onValueChange={(value) => setDegreeProgramId(value ?? "")}
                  >
                    <SelectTrigger id="degree_program_id" className="w-full">
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_PROGRAMS.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="registration_roll_number">
                    Registration / Roll number
                  </FieldLabel>
                  <Input
                    id="registration_roll_number"
                    name="registration_roll_number"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="graduation_year">Graduation year</FieldLabel>
                  <Input
                    id="graduation_year"
                    name="graduation_year"
                    placeholder="2021"
                    inputMode="numeric"
                    pattern="\d{4}"
                    required
                  />
                </Field>

                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="photo">Profile photo</FieldLabel>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      onPhotoChange(event.target.files?.[0] ?? null)
                    }
                  />
                  <FieldDescription>
                    {photoName
                      ? `Selected: ${photoName}`
                      : "Optional. JPG or PNG preferred."}
                  </FieldDescription>
                </Field>
              </div>

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
                  {loading ? "Submitting…" : "Create account"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account? <Link to="/login">Login</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
