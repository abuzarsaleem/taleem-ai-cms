export const DEFAULT_COUNTRY = "Pakistan"

export const COUNTRIES = ["Pakistan"] as const

export const PAKISTAN_CITIES = [
  "Abbottabad",
  "Attock",
  "Bahawalpur",
  "Bannu",
  "Bhakkar",
  "Chakwal",
  "Charsadda",
  "Chiniot",
  "Dera Ghazi Khan",
  "Dera Ismail Khan",
  "Faisalabad",
  "Gilgit",
  "Gwadar",
  "Gujranwala",
  "Gujrat",
  "Hafizabad",
  "Hyderabad",
  "Islamabad",
  "Jacobabad",
  "Jhang",
  "Jhelum",
  "Karachi",
  "Kasur",
  "Khanewal",
  "Khairpur",
  "Kohat",
  "Kotli",
  "Lahore",
  "Larkana",
  "Mandi Bahauddin",
  "Mansehra",
  "Mardan",
  "Mingora",
  "Mirpur",
  "Mirpur Khas",
  "Multan",
  "Murree",
  "Muzaffarabad",
  "Muzaffargarh",
  "Nawabshah",
  "Nowshera",
  "Okara",
  "Peshawar",
  "Quetta",
  "Rahim Yar Khan",
  "Rawalpindi",
  "Sahiwal",
  "Sargodha",
  "Sheikhupura",
  "Shikarpur",
  "Sialkot",
  "Skardu",
  "Sukkur",
  "Swabi",
  "Swat",
  "Taxila",
  "Thatta",
  "Turbat",
  "Wah Cantonment",
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
