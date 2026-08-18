import { useMemo } from "react"

import { SearchableSelect } from "@/components/searchable-select"

type YearPickerProps = {
  id?: string
  value?: string
  onChange?: (year: string) => void
  minYear?: number
  maxYear?: number
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  className?: string
}

export function YearPicker({
  id,
  value,
  onChange,
  minYear = 1980,
  maxYear = new Date().getFullYear(),
  placeholder = "Select year",
  disabled,
  "aria-invalid": ariaInvalid,
  className,
}: YearPickerProps) {
  const options = useMemo(() => {
    const list: { value: string; label: string }[] = []
    for (let year = maxYear; year >= minYear; year -= 1) {
      list.push({ value: String(year), label: String(year) })
    }
    return list
  }, [minYear, maxYear])

  return (
    <SearchableSelect
      id={id}
      value={value ?? ""}
      onChange={(next) => onChange?.(next)}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Search year…"
      emptyText="No matching year"
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={className}
    />
  )
}
