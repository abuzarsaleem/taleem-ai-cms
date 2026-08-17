export type BreadcrumbItem = {
  label: string
  to?: string
}

export type NavTrailItem = {
  label: string
  to: string
}

export type NavTrailState = {
  fromTrail?: NavTrailItem[]
}

const SECTIONS: Record<string, { label: string; root: string }> = {
  registrations: { label: "Registrations", root: "/registrations" },
  alumni: { label: "Alumni directory", root: "/alumni" },
  announcements: { label: "Announcements", root: "/announcements" },
  events: { label: "Events", root: "/events" },
  "contact-requests": { label: "Contact requests", root: "/contact-requests" },
}

function detailLabel(section: string) {
  switch (section) {
    case "alumni":
      return "Alumni profile"
    case "registrations":
      return "Registration"
    case "announcements":
      return "Announcement"
    case "events":
      return "Event"
    case "contact-requests":
      return "Contact request"
    default:
      return "Detail"
  }
}

export function getBreadcrumbs(
  pathname: string,
  fromTrail?: NavTrailItem[],
): BreadcrumbItem[] {
  if (pathname.startsWith("/alumni/") && fromTrail?.length) {
    return [
      { label: "Admin", to: "/" },
      ...fromTrail,
      { label: "Alumni profile" },
    ]
  }

  if (pathname === "/") {
    return [{ label: "Admin", to: "/" }, { label: "Dashboard" }]
  }

  const segments = pathname.split("/").filter(Boolean)
  const sectionKey = segments[0] ?? ""
  const section = SECTIONS[sectionKey]

  if (!section) {
    return [{ label: "Admin", to: "/" }, { label: "Admin" }]
  }

  const crumbs: BreadcrumbItem[] = [
    { label: "Admin", to: "/" },
    { label: section.label, to: section.root },
  ]

  if (segments.length === 1) {
    crumbs[1] = { label: section.label }
    return crumbs
  }

  if (segments[1] === "new") {
    crumbs.push({
      label: sectionKey === "events" ? "New event" : "New announcement",
    })
    return crumbs
  }

  const id = segments[1]
  const isEdit = segments[2] === "edit"
  const label = detailLabel(sectionKey)

  if (isEdit) {
    crumbs.push({ label, to: `/${sectionKey}/${id}` })
    crumbs.push({ label: `Edit ${label.toLowerCase()}` })
    return crumbs
  }

  crumbs.push({ label })
  return crumbs
}

export function trailFromLocation(pathname: string): NavTrailItem[] {
  return getBreadcrumbs(pathname)
    .map((crumb) => ({
      label: crumb.label,
      to: crumb.to ?? pathname,
    }))
    .filter((crumb) => crumb.to !== "/")
}

export function withNavTrail<T extends object>(pathname: string, state?: T) {
  return {
    ...(state ?? {}),
    fromTrail: trailFromLocation(pathname),
  }
}

export function backToFromTrail(fromTrail?: NavTrailItem[], fallback = "/") {
  return fromTrail?.at(-1)?.to ?? fallback
}
