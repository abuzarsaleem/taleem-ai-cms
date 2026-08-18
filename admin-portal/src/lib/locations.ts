export const DEFAULT_COUNTRY = "Pakistan"

const ISO_ALPHA2 = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU",
  "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL",
  "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC",
  "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV",
  "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG",
  "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD",
  "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM",
  "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH",
  "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
  "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH",
  "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR",
  "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR",
  "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC",
  "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL",
  "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY",
  "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA",
  "ZM", "ZW",
] as const

function countryNamesFromRegions() {
  const display = new Intl.DisplayNames(["en"], { type: "region" })
  const names = ISO_ALPHA2.map((code) => display.of(code)?.trim()).filter(
    (name): name is string => Boolean(name),
  )
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "en"))
}

export function isPakistan(country?: string | null) {
  const value = country?.trim().toLowerCase()
  return value === "pakistan" || value === "pk" || value === "pak"
}

export const COUNTRIES = (() => {
  const names = countryNamesFromRegions()
  const pakistan = names.filter((name) => isPakistan(name))
  const rest = names.filter((name) => !isPakistan(name))
  return pakistan.length ? [...pakistan, ...rest] : [DEFAULT_COUNTRY, ...rest]
})()

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
