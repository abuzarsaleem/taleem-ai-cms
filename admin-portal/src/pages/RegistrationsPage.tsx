import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ChevronRightIcon } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import {
  degreeProgramLabel,
  registrationStatusVariant,
} from "@/lib/registration-utils"
import { cn } from "@/lib/utils"
import {
  registrationService,
  type RegistrationListItem,
  type RegistrationStatus,
} from "@/services/registration.service"

const STATUS_FILTERS: Array<{ label: string; value: RegistrationStatus | "" }> =
  [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ]

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatSubmittedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted/40 px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegistrationsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get("status")
  const statusFilter =
    statusParam === "PENDING" ||
    statusParam === "APPROVED" ||
    statusParam === "REJECTED"
      ? statusParam
      : ""

  const [items, setItems] = useState<RegistrationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return

    let cancelled = false

    void (async () => {
      setLoading(true)
      setError("")
      try {
        const result = await registrationService.list(token, statusFilter)
        if (!cancelled) setItems(result)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load registrations",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, statusFilter])

  function setStatus(next: RegistrationStatus | "") {
    if (!next) {
      setSearchParams({})
      return
    }
    setSearchParams({ status: next })
  }

  return (
    <div className="flex flex-1 flex-col gap-5 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and decide on alumni applications
            {!loading ? (
              <span className="text-muted-foreground/80">
                {" "}
                · {items.length} result{items.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>
        </div>

        <div className="inline-flex w-fit rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                statusFilter === filter.value
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {error ? (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        ) : null}

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Applicant
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                    Program
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Roll
                  </TableHead>
                  <TableHead className="h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="hidden h-11 bg-muted/40 px-4 text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Submitted
                  </TableHead>
                  <TableHead className="h-11 w-12 bg-muted/40 px-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.registration_id}
                    className="group cursor-pointer"
                    onClick={() =>
                      navigate(`/registrations/${item.registration_id}`)
                    }
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9">
                          {item.photo_url ? (
                            <AvatarImage
                              src={item.photo_url}
                              alt={item.full_name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {initialsFromName(item.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {item.full_name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[14rem] px-4 py-3 md:table-cell">
                      <span className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
                        {degreeProgramLabel(item.degree_program_id)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                      {item.registration_roll_number}
                      <span className="mx-1.5 text-border">·</span>
                      {item.graduation_year}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={registrationStatusVariant(item.status)}
                        className={cn(
                          "font-normal",
                          item.status === "PENDING" &&
                            "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          item.status === "APPROVED" &&
                            "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {formatSubmittedDate(item.submitted_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100"
                        render={
                          <Link
                            to={`/registrations/${item.registration_id}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                      >
                        <ChevronRightIcon />
                        <span className="sr-only">
                          {item.status === "PENDING" ? "Review" : "View"}{" "}
                          {item.full_name}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!items.length ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      No registrations found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
