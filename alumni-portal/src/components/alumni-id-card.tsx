import { useEffect, useState } from "react"
import QRCode from "qrcode"

import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"

export type AlumniIdCardData = {
  fullName: string
  photoUrl?: string | null
  degreeLabel?: string | null
  graduationYear?: string | null
  registrationRollNumber?: string | null
  campus?: string | null
  cnic?: string | null
  alumniId?: string | null
}

type AlumniIdCardProps = {
  data: AlumniIdCardData
  className?: string
  showQr?: boolean
  qrCodeUrl?: string | null
  cardId?: string
}

function maskCnic(cnic?: string | null) {
  if (!cnic) return "—"
  const digits = cnic.replace(/\D/g, "")
  if (digits.length < 5) return cnic
  return `${digits.slice(0, 5)}-*****-${digits.slice(-1)}`
}

function shortAlumniId(id?: string | null) {
  if (!id) return "—"
  if (/^ALM-\d{4}-\d{7}$/i.test(id.trim())) return id.trim().toUpperCase()
  const compact = id.replace(/-/g, "")
  return `ALM-${compact.slice(0, 4).toUpperCase()}-${compact
    .slice(-7)
    .toUpperCase()}`
}

function verificationUrl(alumniId: string) {
  return `${window.location.origin}/alumni/verify/${encodeURIComponent(alumniId)}`
}

function formatCampus(campus?: string | null, degreeLabel?: string | null) {
  const raw =
    campus ?? degreeLabel?.split(" — ").slice(1).join(" — ") ?? null
  if (!raw) return "—"
  const trimmed = raw.trim()
  if (/campus/i.test(trimmed)) return trimmed
  return `${trimmed} Campus`
}

/** CR80 credit-card ratio: 85.60 × 53.98 mm */
export const ALUMNI_CARD_ASPECT = "85.6 / 53.98"

export function AlumniIdCard({
  data,
  className,
  showQr = false,
  qrCodeUrl,
  cardId = "alumni-id-card",
}: AlumniIdCardProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const degreeShort =
    data.degreeLabel?.split(" — ")[0] ?? data.degreeLabel ?? "Alumni member"
  const campus = formatCampus(data.campus, data.degreeLabel)
  const initials = data.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  const year = new Date().getFullYear()

  useEffect(() => {
    if (!showQr) {
      setQrSrc(null)
      return
    }

    let cancelled = false

    async function buildQr() {
      if (data.alumniId) {
        try {
          const dataUrl = await QRCode.toDataURL(
            verificationUrl(data.alumniId),
            {
              width: 220,
              margin: 1,
              errorCorrectionLevel: "M",
              color: { dark: "#081b45", light: "#ffffff" },
            },
          )
          if (!cancelled) setQrSrc(dataUrl)
          return
        } catch {
          // fall through
        }
      }
      if (!cancelled) setQrSrc(qrCodeUrl ?? null)
    }

    void buildQr()
    return () => {
      cancelled = true
    }
  }, [showQr, data.alumniId, qrCodeUrl])

  return (
    <div
      className={cn("mx-auto w-full max-w-[540px]", className)}
      style={{ aspectRatio: ALUMNI_CARD_ASPECT }}
    >
      <div
        id={cardId}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[14px] border border-[#cfd9e8] bg-[#fbfcfe]"
        style={{ boxShadow: "0 16px 36px rgba(8, 27, 69, 0.12)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 bg-[#081b45] px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
          <BrandLogo
            onDark
            className="h-6 max-w-[128px] sm:h-8 sm:max-w-[165px]"
            plateClassName="rounded px-1.5 py-1"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#159570] px-2 py-0.5 text-[8px] font-bold tracking-[0.1em] text-white uppercase sm:px-2.5 sm:py-1 sm:text-[9px]">
            <span className="size-1.5 rounded-full bg-white" />
            Active
          </span>
        </div>

        {/* Body — photo | details | QR (bottom-aligned, matches PDF) */}
        <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-2 overflow-hidden px-3 pt-2.5 pb-2 sm:gap-3.5 sm:px-5 sm:pt-3.5 sm:pb-2.5">
          <div className="shrink-0 self-start overflow-hidden rounded-md border border-[#dde5f0] bg-[#e8eef6]">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt=""
                className="size-[52px] object-cover object-top sm:size-[76px]"
              />
            ) : (
              <div className="flex size-[52px] items-center justify-center text-sm font-extrabold text-[#174ea6] sm:size-[76px] sm:text-lg">
                {initials}
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <p className="text-[7px] font-bold tracking-[0.14em] text-[#1e8f97] uppercase sm:text-[9px]">
              Verified Alumni
            </p>
            <h2 className="mt-0.5 truncate text-[0.9rem] leading-tight font-bold text-[#081b45] capitalize sm:mt-1 sm:text-[1.125rem]">
              {data.fullName}
            </h2>
            {data.registrationRollNumber ? (
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#64748b] sm:text-[11px]">
                Roll {data.registrationRollNumber}
              </p>
            ) : null}

            <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#e8eef4] pt-1.5 sm:gap-x-4 sm:gap-y-3 sm:pt-2.5">
              <Field label="Degree" value={degreeShort} />
              <Field label="Graduation" value={data.graduationYear ?? "—"} />
              <Field label="Campus" value={campus} />
              <Field label="CNIC" value={maskCnic(data.cnic)} />
            </div>
          </div>

          {showQr ? (
            <div className="shrink-0 self-end rounded border border-[#dde5f0] bg-white p-0.5">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="Verification QR"
                  className="size-[42px] sm:size-[50px]"
                />
              ) : (
                <div className="flex size-[42px] items-center justify-center text-[7px] text-[#94a3b8] sm:size-[50px]">
                  QR
                </div>
              )}
            </div>
          ) : (
            <div className="w-[42px] self-end sm:w-[50px]" aria-hidden />
          )}
        </div>

        {/* Footer — white, navy ID text (must match PDF) */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e8eef4] bg-white px-3 py-1.5 sm:px-5 sm:py-2">
          <div className="min-w-0">
            <p className="text-[7px] font-semibold tracking-[0.12em] text-[#64748b] uppercase sm:text-[8px]">
              Alumni ID · {year}
            </p>
            <p className="truncate text-[9px] font-bold tracking-wide text-[#081b45] sm:text-[10px]">
              {shortAlumniId(data.alumniId)}
            </p>
          </div>
          <p className="shrink-0 text-[7px] font-semibold tracking-[0.1em] text-[#94a3b8] uppercase sm:text-[8px]">
            Iqra University
          </p>
        </div>

        <div className="flex h-[6px]">
          <div className="w-[34%] bg-[#081b45]" />
          <div className="w-[33%] bg-[#1e8f97]" />
          <div className="w-[33%] bg-[#36babc]" />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[7px] font-bold tracking-[0.1em] text-[#94a3b8] uppercase sm:text-[8px]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[9px] font-semibold text-[#0f172a] sm:mt-1 sm:text-[11px]">
        {value}
      </p>
    </div>
  )
}
