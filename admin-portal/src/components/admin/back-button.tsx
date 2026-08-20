import { ArrowLeftIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useBackNavigation } from "@/lib/nav-trail"

export function BackButton({
  fallback,
  label = "Back",
}: {
  fallback: string
  label?: string
}) {
  const navigate = useNavigate()
  const { backTo, backState } = useBackNavigation(fallback)

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={() =>
        navigate(backTo, backState ? { state: backState } : undefined)
      }
    >
      <ArrowLeftIcon />
      {label}
    </Button>
  )
}
