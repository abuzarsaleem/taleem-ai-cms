export const DEFAULT_COUNTRY = "Pakistan"

export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Egypt",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Latvia",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Maldives",
  "Malta",
  "Mexico",
  "Morocco",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uzbekistan",
  "Vietnam",
  "Yemen",
] as const

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

export function isPakistan(country?: string | null): boolean {
  return countryValue(country) === DEFAULT_COUNTRY
}

export function countryOptions(current?: string | null): string[] {
  const countries: string[] = [...COUNTRIES]
  const trimmed = current?.trim()
  if (
    trimmed &&
    !countries.some((item) => item.toLowerCase() === trimmed.toLowerCase())
  ) {
    countries.unshift(trimmed)
  }
  return countries
}

export function cityOptions(
  country?: string | null,
  current?: string | null,
): string[] {
  if (!isPakistan(country)) return []
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

export function selectedCity(
  country?: string | null,
  current?: string | null,
): string {
  const trimmed = current?.trim()
  if (!trimmed) return ""
  if (!isPakistan(country)) return trimmed
  const match = PAKISTAN_CITIES.find(
    (city) => city.toLowerCase() === trimmed.toLowerCase(),
  )
  return match ?? trimmed
}

export function countryValue(current?: string | null): string {
  const trimmed = current?.trim()
  return trimmed || DEFAULT_COUNTRY
}
