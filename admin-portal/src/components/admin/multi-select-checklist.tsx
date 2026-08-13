import { cn } from "@/lib/utils"

type Option = {
  value: string
  label: string
  hint?: string
}

type MultiSelectChecklistProps = {
  title: string
  description?: string
  options: Option[]
  values: string[]
  disabled?: boolean
  emptyText?: string
  onChange: (next: string[]) => void
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

export function MultiSelectChecklist({
  title,
  description,
  options,
  values,
  disabled = false,
  emptyText = "No options available",
  onChange,
}: MultiSelectChecklistProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="max-h-48 overflow-auto rounded-lg border">
        {options.length ? (
          options.map((option) => {
            const checked = values.includes(option.value)
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/40",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(toggleValue(values, option.value))}
                />
                <span className="min-w-0">
                  <span className="block text-sm">{option.label}</span>
                  {option.hint ? (
                    <span className="block text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })
        ) : (
          <p className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
      {values.length ? (
        <p className="text-xs text-muted-foreground">
          {values.length} selected
        </p>
      ) : null}
    </div>
  )
}
