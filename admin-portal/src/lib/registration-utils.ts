const DEGREE_PROGRAMS: Record<string, string> = {
  "55555555-5555-4555-8555-555555555501":
    "BS Computer Science — Chak Shahzad",
  "55555555-5555-4555-8555-555555555502":
    "BS Software Engineering — Chak Shahzad",
  "55555555-5555-4555-8555-555555555503":
    "BS Artificial Intelligence — Chak Shahzad",
  "55555555-5555-4555-8555-555555555504": "BS Data Science — Chak Shahzad",
  "55555555-5555-4555-8555-555555555505": "MS Computer Science — Chak Shahzad",
  "55555555-5555-4555-8555-555555555507":
    "BBA Business Administration — Chak Shahzad",
  "55555555-5555-4555-8555-555555555508": "MBA — Chak Shahzad",
}

export function degreeProgramLabel(id: string | null | undefined) {
  if (!id) return "—"
  return DEGREE_PROGRAMS[id] ?? id
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function registrationStatusVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "default" as const
    case "REJECTED":
      return "destructive" as const
    default:
      return "secondary" as const
  }
}
