export const DEFAULT_COUNTRY = "Pakistan"

export const COUNTRIES = ["Pakistan"] as const

export const PAKISTAN_CITIES = [
  "Karachi",
  "Islamabad",
  "Lahore",
  "Multan",
  "Rawalpindi",
  "Faisalabad",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
] as const

export function cityOptions(current?: string | null): string[] {
  const cities: string[] = [...PAKISTAN_CITIES]
  const trimmed = current?.trim()
  if (
    trimmed &&
    !cities.some((city) => city.toLowerCase() === trimmed.toLowerCase())
  ) {
    cities.unshift(trimmed)
  }
  return cities
}

export function selectedCity(current?: string | null): string {
  const trimmed = current?.trim()
  if (!trimmed) return ""
  const match = PAKISTAN_CITIES.find(
    (city) => city.toLowerCase() === trimmed.toLowerCase(),
  )
  return match ?? trimmed
}

export function countryValue(current?: string | null): string {
  const trimmed = current?.trim()
  return trimmed || DEFAULT_COUNTRY
}
