import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import type { Value as E164Number } from "react-phone-number-input"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import {
  formatCnicInput,
  MAX_GRADUATION_YEAR,
  MIN_GRADUATION_YEAR,
  validatePhotoFile,
  validateRegistration,
  type RegistrationErrors,
} from "@/lib/registration-validation"
import { authService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { YearPicker } from "@/components/ui/year-picker"

const DEGREE_PROGRAMS = [
  {
    id: "55555555-5555-4555-8555-555555555501",
    label: "BS Computer Science — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555502",
    label: "BS Software Engineering — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555503",
    label: "BS Artificial Intelligence — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555504",
    label: "BS Data Science — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555505",
    label: "MS Computer Science — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555507",
    label: "BBA Business Administration — Chak Shahzad",
  },
  {
    id: "55555555-5555-4555-8555-555555555508",
    label: "MBA — Chak Shahzad",
  },
]

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [errors, setErrors] = useState<RegistrationErrors>({})

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [cnic, setCnic] = useState("")
  const [rollNumber, setRollNumber] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [degreeProgramId, setDegreeProgramId] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>()
  const [whatsappNumber, setWhatsappNumber] = useState<E164Number | undefined>()

  const selectedProgramLabel =
    DEGREE_PROGRAMS.find((program) => program.id === degreeProgramId)?.label ??
    null

  function clearFieldError(field: keyof RegistrationErrors) {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function onPhotoChange(file: File | null) {
    setApiError("")
    if (!file) {
      setPhoto(null)
      clearFieldError("photo")
      return
    }

    const photoError = validatePhotoFile(file)
    if (photoError) {
      setPhoto(null)
      setErrors((current) => ({ ...current, photo: photoError }))
      return
    }

    setPhoto(file)
    clearFieldError("photo")
  }

  function resetForm() {
    setFullName("")
    setEmail("")
    setCnic("")
    setRollNumber("")
    setDegreeProgramId("")
    setGraduationYear("")
    setPhoneNumber(undefined)
    setWhatsappNumber(undefined)
    setPhoto(null)
    setErrors({})
    setApiError("")
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError("")

    const nextErrors = validateRegistration({
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      cnic_national_id: cnic,
      degree_program_id: degreeProgramId,
      registration_roll_number: rollNumber,
      graduation_year: graduationYear,
      photo,
    })

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)

    try {
      let mediaId: string | undefined
      if (photo) {
        try {
          const upload = await authService.uploadPhoto(photo)
          mediaId = upload.media_id
          if (!mediaId) {
            setErrors({ photo: "Photo upload did not return a media id" })
            return
          }
        } catch (err) {
          setErrors({
            photo:
              err instanceof ApiError ? err.message : "Photo upload failed",
          })
          return
        }
      }

      const result = await authService.register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber || undefined,
        whatsapp_number: whatsappNumber || undefined,
        cnic_national_id: cnic.trim(),
        degree_program_id: degreeProgramId,
        registration_roll_number: rollNumber.trim(),
        graduation_year: graduationYear,
        media_id: mediaId,
      })

      toast.success("Registration submitted", {
        description:
          result.message ||
          "Your registration is pending approval. You will be notified once it is reviewed.",
        duration: 6000,
      })
      resetForm()
      event.currentTarget.reset()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registration failed"
      setApiError(message)
      toast.error("Registration failed", {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Register for Taleem Alumni verification
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  data-invalid={!!errors.full_name || undefined}
                >
                  <FieldLabel htmlFor="full_name">Full name</FieldLabel>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Ali Khan"
                    value={fullName}
                    maxLength={150}
                    aria-invalid={!!errors.full_name}
                    onChange={(event) => {
                      setFullName(event.target.value)
                      clearFieldError("full_name")
                    }}
                  />
                  <FieldError>{errors.full_name}</FieldError>
                </Field>

                <Field
                  className="sm:col-span-2"
                  data-invalid={!!errors.email || undefined}
                >
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    maxLength={255}
                    aria-invalid={!!errors.email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      clearFieldError("email")
                    }}
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>

                <Field data-invalid={!!errors.phone_number || undefined}>
                  <FieldLabel htmlFor="phone_number">Phone number</FieldLabel>
                  <PhoneInput
                    id="phone_number"
                    international
                    defaultCountry="PK"
                    placeholder="300 1234567"
                    value={phoneNumber}
                    aria-invalid={!!errors.phone_number}
                    onChange={(value) => {
                      setPhoneNumber(value)
                      clearFieldError("phone_number")
                    }}
                  />
                  <FieldError>{errors.phone_number}</FieldError>
                </Field>

                <Field data-invalid={!!errors.whatsapp_number || undefined}>
                  <FieldLabel htmlFor="whatsapp_number">WhatsApp number</FieldLabel>
                  <PhoneInput
                    id="whatsapp_number"
                    international
                    defaultCountry="PK"
                    placeholder="300 1234567"
                    value={whatsappNumber}
                    aria-invalid={!!errors.whatsapp_number}
                    onChange={(value) => {
                      setWhatsappNumber(value)
                      clearFieldError("whatsapp_number")
                    }}
                  />
                  <FieldError>{errors.whatsapp_number}</FieldError>
                </Field>

                <Field
                  className="sm:col-span-2"
                  data-invalid={!!errors.cnic_national_id || undefined}
                >
                  <FieldLabel htmlFor="cnic_national_id">CNIC / National ID</FieldLabel>
                  <Input
                    id="cnic_national_id"
                    name="cnic_national_id"
                    placeholder="35202-1234567-1"
                    inputMode="numeric"
                    value={cnic}
                    maxLength={15}
                    aria-invalid={!!errors.cnic_national_id}
                    onChange={(event) => {
                      setCnic(formatCnicInput(event.target.value))
                      clearFieldError("cnic_national_id")
                    }}
                  />
                  <FieldError>{errors.cnic_national_id}</FieldError>
                </Field>

                <Field
                  className="sm:col-span-2"
                  data-invalid={!!errors.degree_program_id || undefined}
                >
                  <FieldLabel htmlFor="degree_program_id">Degree program</FieldLabel>
                  <Select
                    value={degreeProgramId}
                    onValueChange={(value) => {
                      setDegreeProgramId(value ?? "")
                      clearFieldError("degree_program_id")
                    }}
                  >
                    <SelectTrigger
                      id="degree_program_id"
                      className="w-full"
                      aria-invalid={!!errors.degree_program_id}
                    >
                      <SelectValue placeholder="Select your program">
                        {selectedProgramLabel}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_PROGRAMS.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.degree_program_id}</FieldError>
                </Field>

                <Field data-invalid={!!errors.registration_roll_number || undefined}>
                  <FieldLabel htmlFor="registration_roll_number">
                    Registration / Roll number
                  </FieldLabel>
                  <Input
                    id="registration_roll_number"
                    name="registration_roll_number"
                    value={rollNumber}
                    maxLength={50}
                    aria-invalid={!!errors.registration_roll_number}
                    onChange={(event) => {
                      setRollNumber(event.target.value)
                      clearFieldError("registration_roll_number")
                    }}
                  />
                  <FieldError>{errors.registration_roll_number}</FieldError>
                </Field>

                <Field data-invalid={!!errors.graduation_year || undefined}>
                  <FieldLabel htmlFor="graduation_year">Graduation year</FieldLabel>
                  <YearPicker
                    id="graduation_year"
                    value={graduationYear}
                    minYear={MIN_GRADUATION_YEAR}
                    maxYear={MAX_GRADUATION_YEAR}
                    placeholder="Select year"
                    aria-invalid={!!errors.graduation_year}
                    onChange={(year) => {
                      setGraduationYear(year)
                      clearFieldError("graduation_year")
                    }}
                  />
                  <FieldError>{errors.graduation_year}</FieldError>
                </Field>

                <Field
                  className="sm:col-span-2"
                  data-invalid={!!errors.photo || undefined}
                >
                  <FieldLabel htmlFor="photo">Profile photo</FieldLabel>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    aria-invalid={!!errors.photo}
                    onChange={(event) =>
                      onPhotoChange(event.target.files?.[0] ?? null)
                    }
                  />
                  <FieldError>{errors.photo}</FieldError>
                </Field>
              </div>

              {apiError ? (
                <p className="text-sm text-destructive" role="alert">
                  {apiError}
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
