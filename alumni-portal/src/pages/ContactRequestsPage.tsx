import { formatDistanceToNow, parseISO } from "date-fns"
import {
  ArrowUpRight,
  Check,
  Clock3,
  ContactRound,
  Search,
  XCircle,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { LinkWithFrom } from "@/components/page-breadcrumb"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { contactRequestService } from "@/services/contact-requests.service"
import { directoryService } from "@/services/directory.service"
import type { ContactRequest, DirectoryAlumni } from "@/types/portal"

function relativeTime(value: string) {
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return value
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function parseReason(reason: string) {
  const parts = reason.split(/\n\nRequested:\s*/i)
  const purpose = (parts[0] ?? reason).trim()
  const channels = (parts[1] ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
  return { purpose, channels }
}

function channelLabels(fields: string[] | undefined, fallbackReason: string) {
  if (fields?.length) {
    return fields.map((field) => {
      switch (field) {
        case "email":
          return "Email"
        case "mobile":
          return "Mobile"
        case "whatsapp":
          return "WhatsApp"
        default:
          return field
      }
    })
  }
  return parseReason(fallbackReason).channels
}

function statusMeta(status: string) {
  switch (status) {
    case "PENDING_ADMIN":
      return {
        label: "Pending admin review",
        tone: "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
        icon: Clock3,
      }
    case "PENDING_ALUMNI":
      return {
        label: "Pending alumni response",
        tone: "bg-sky-50 text-sky-800 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30",
        icon: Clock3,
      }
    case "APPROVED":
      return {
        label: "Connected",
        tone: "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
        icon: Check,
      }
    case "REJECTED_BY_ADMIN":
      return {
        label: "Rejected by admin",
        tone: "bg-rose-50 text-rose-800 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
        icon: XCircle,
      }
    case "REJECTED_BY_ALUMNI":
      return {
        label: "Rejected",
        tone: "bg-rose-50 text-rose-800 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",
        icon: XCircle,
      }
    default:
      return {
        label: status,
        tone: "bg-muted text-muted-foreground ring-border",
        icon: Clock3,
      }
  }
}

function isRequested(status: string) {
  return (
    status === "PENDING_ADMIN" ||
    status === "PENDING_ALUMNI" ||
    status === "REJECTED_BY_ADMIN" ||
    status === "REJECTED_BY_ALUMNI"
  )
}

function isContact(status: string) {
  return status === "APPROVED"
}

const avatarTones = [
  "from-[#dce9ff] to-[#c5d9ff] text-[#174ea6]",
  "from-[#d4f5f1] to-[#b8ebe4] text-[#0b6e6a]",
  "from-[#e8e4ff] to-[#d4cef8] text-[#4b3f9a]",
  "from-[#ffe8d6] to-[#ffd4b8] text-[#9a4d1c]",
]

type Tab = "contacts" | "requested"

export function ContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([])
  const [profiles, setProfiles] = useState<Record<string, DirectoryAlumni>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("contacts")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await contactRequestService.listSent()
        if (cancelled) return
        setItems(data)

        const ids = [...new Set(data.map((item) => item.target_alumni_id))]
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const alumni = await directoryService.getOne(id)
              return [id, alumni] as const
            } catch {
              return null
            }
          }),
        )
        if (cancelled) return
        const next: Record<string, DirectoryAlumni> = {}
        for (const entry of entries) {
          if (entry) next[entry[0]] = entry[1]
        }
        setProfiles(next)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load contact requests",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const contacts = useMemo(
    () => items.filter((item) => isContact(item.status)),
    [items],
  )
  const requested = useMemo(
    () => items.filter((item) => isRequested(item.status)),
    [items],
  )
  const visible = tab === "contacts" ? contacts : requested

  return (
    <div className="relative mx-auto max-w-4xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden rounded-[1.5rem] opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(54,186,188,0.12),transparent_55%),radial-gradient(ellipse_at_top_left,rgba(8,27,69,0.06),transparent_50%)]" />
      </div>

      <div className="relative space-y-8 px-5 pt-5 sm:px-6 sm:pt-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
              Network
            </p>
            <h1 className="mt-2.5 font-display text-[2rem] leading-[1.15] font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
              My Contacts
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              People you’ve connected with, and requests still in progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:mt-8 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              {contacts.length} connected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm">
              <Clock3 className="size-3.5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              {requested.length} requested
            </span>
          </div>
        </header>

        <div className="inline-flex w-full max-w-md rounded-2xl border border-border bg-card p-1.5 shadow-[var(--portal-shadow)] sm:w-auto">
          {(
            [
              {
                id: "contacts" as const,
                label: "Contacts",
                count: contacts.length,
              },
              {
                id: "requested" as const,
                label: "Requested",
                count: requested.length,
              },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none",
                tab === option.id
                  ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(8,27,69,0.18)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  tab === option.id
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[108px] animate-pulse rounded-[1.25rem] bg-muted"
              />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Unavailable</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : visible.length === 0 ? (
          <div className="rounded-[1.35rem] border border-dashed border-border bg-card px-8 py-14 text-center shadow-[var(--portal-shadow)]">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-foreground">
              {tab === "contacts" ? (
                <ContactRound className="size-5" />
              ) : (
                <Search className="size-5" />
              )}
            </div>
            <p className="font-semibold text-foreground">
              {tab === "contacts" ? "No contacts yet" : "No requests yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "contacts"
                ? "Approved connections will show up here."
                : "Requests you send from the directory appear here."}
            </p>
            <Link
              to="/directory"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_22px_rgba(8,27,69,0.16)]"
            >
              Browse directory
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item, index) => {
              const alumni = profiles[item.target_alumni_id]
              const meta = statusMeta(item.status)
              const StatusIcon = meta.icon
              const purpose = parseReason(item.request_reason).purpose
              const channels = channelLabels(
                item.requested_fields,
                item.request_reason,
              )
              const name = alumni?.full_name ?? "Alumni member"
              const role =
                alumni?.professional[0]?.job_title ??
                alumni?.professional[0]?.role ??
                alumni?.primary_role
              const company = alumni?.professional[0]?.current_company
              const subtitle = [role, company].filter(Boolean).join(" · ")
              const tone = avatarTones[index % avatarTones.length]

              return (
                <article
                  key={item.id}
                  className="group flex flex-col gap-4 rounded-[1.25rem] border border-border bg-card p-5 text-card-foreground shadow-[var(--portal-shadow)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_40px_rgba(8,27,69,0.1)] sm:flex-row sm:items-center sm:gap-5 sm:p-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    {alumni?.photo_url ? (
                      <img
                        src={alumni.photo_url}
                        alt=""
                        className="size-14 shrink-0 rounded-2xl object-cover ring-2 ring-background shadow-[0_8px_18px_rgba(8,27,69,0.1)]"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-extrabold ring-2 ring-background shadow-[0_8px_18px_rgba(8,27,69,0.08)]",
                          tone,
                        )}
                      >
                        {initials(name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground capitalize">
                          {name}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1",
                            meta.tone,
                          )}
                        >
                          <StatusIcon className="size-3" strokeWidth={2.5} />
                          {meta.label}
                        </span>
                      </div>

                      {subtitle ? (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {subtitle}
                        </p>
                      ) : null}

                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {purpose}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {channels.map((channel) => (
                          <span
                            key={channel}
                            className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground"
                          >
                            {channel}
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {relativeTime(item.created_at)}
                        </span>
                      </div>

                      {item.rejection_reason ? (
                        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                          Reason: {item.rejection_reason}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <LinkWithFrom
                    to={`/directory/${item.target_alumni_id}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_22px_rgba(8,27,69,0.16)] transition hover:bg-primary/90 sm:self-center"
                  >
                    View profile
                    <ArrowUpRight className="size-4 opacity-90" />
                  </LinkWithFrom>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
