import { cn } from "@/lib/utils"

export const BRAND_LOGO_SRC = "/logo.png"
export const BRAND_LOGO_ALT =
  "Iqra University, Chak Shahzad Campus, Islamabad"

type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      className={cn("h-10 w-auto object-contain object-left", className)}
    />
  )
}
