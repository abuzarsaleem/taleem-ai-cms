import { jsPDF } from "jspdf"
import QRCode from "qrcode"

import type { AlumniIdCardData } from "@/components/alumni-id-card"
import { profileService } from "@/services/profile.service"

/** ISO/IEC 7810 ID-1 (CR80) — must match on-screen AlumniIdCard */
const W = 85.6
const H = 53.98

// Colors mirrored from alumni-id-card.tsx
const NAVY = [8, 27, 69] as const
const TEAL = [30, 143, 151] as const
const TEAL_LIGHT = [54, 186, 188] as const
const GREEN = [21, 149, 112] as const
const SLATE = [100, 116, 139] as const
const MUTED = [148, 163, 184] as const
const LINE = [232, 238, 244] as const
const PHOTO_BG = [232, 238, 246] as const
const BORDER = [221, 229, 240] as const

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

function degreeShort(label?: string | null) {
  return label?.split(" — ")[0] ?? label ?? "Alumni member"
}

function campusLabel(data: AlumniIdCardData) {
  const raw =
    data.campus ??
    data.degreeLabel?.split(" — ").slice(1).join(" — ") ??
    "Campus"
  if (/campus/i.test(raw)) return raw
  return `${raw} Campus`
}

function truncate(text: string, max: number) {
  const value = text.trim()
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(1, max - 1))}…`
}

async function blobToJpegDataUrl(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement("canvas")
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    return canvas.toDataURL("image/jpeg", 0.92)
  } catch {
    return null
  }
}

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    if (src.startsWith("data:")) return src
    const absolute = new URL(src, window.location.origin).toString()
    const response = await fetch(absolute, {
      mode: "cors",
      credentials: "omit",
    })
    if (!response.ok) return null
    return blobToJpegDataUrl(await response.blob())
  } catch {
    return null
  }
}

async function loadProfilePhotoDataUrl(
  photoUrl?: string | null,
): Promise<string | null> {
  try {
    const blob = await profileService.getMyPhotoBlob()
    if (blob.type.startsWith("image/") || blob.size > 0) {
      const fromApi = await blobToJpegDataUrl(blob)
      if (fromApi) return fromApi
    }
  } catch {
    // fall through
  }
  if (!photoUrl) return null
  return loadImageDataUrl(photoUrl)
}

function addImage(
  pdf: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG"
  pdf.addImage(dataUrl, format, x, y, w, h)
}

function drawField(
  pdf: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxW: number,
) {
  pdf.setTextColor(...MUTED)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(3.8)
  pdf.text(label.toUpperCase(), x, y)

  pdf.setTextColor(...NAVY)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6)
  pdf.text(truncate(value, 26), x, y + 3.4, { maxWidth: maxW })
}

export type AlumniCardPdfInput = AlumniIdCardData & {
  qrCodeUrl?: string | null
}

/**
 * CR80 PDF — layout locked to match AlumniIdCard on screen:
 * navy header → photo | details | QR → white footer → tri-color accent
 */
export async function downloadAlumniCardPdf(
  data: AlumniCardPdfInput,
  fileName = "alumni-id-card.pdf",
) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [W, H],
  })

  const pad = 4.2
  const headerH = 11.2
  const footerH = 7.2
  const accentH = 1.5
  const bodyBottom = H - footerH - accentH

  // Card background (same as screen #fbfcfe)
  pdf.setFillColor(251, 252, 254)
  pdf.rect(0, 0, W, H, "F")

  // ——— Header (navy) ———
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, W, headerH, "F")

  // Logo white plate (matches BrandLogo onDark)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(pad, 2.3, 26, 6.6, 0.6, 0.6, "F")
  const logo = await loadImageDataUrl("/logo.png")
  if (logo) {
    addImage(pdf, logo, pad + 0.6, 2.7, 24.5, 5.8)
  }

  // Active badge
  pdf.setFillColor(...GREEN)
  pdf.roundedRect(W - pad - 13.2, 3.4, 13.2, 4.4, 1.2, 1.2, "F")
  pdf.setFillColor(255, 255, 255)
  pdf.circle(W - pad - 10.8, 5.6, 0.5, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(5)
  pdf.text("ACTIVE", W - pad - 9.2, 6.3)

  // ——— Body ———
  const photoSize = 15.2
  const photoX = pad
  const photoY = headerH + 3.2

  pdf.setFillColor(...PHOTO_BG)
  pdf.roundedRect(photoX, photoY, photoSize, photoSize, 0.8, 0.8, "F")
  if (data.photoUrl) {
    const photo = await loadProfilePhotoDataUrl(data.photoUrl)
    if (photo) addImage(pdf, photo, photoX, photoY, photoSize, photoSize)
  } else {
    pdf.setTextColor(23, 78, 166)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    const initials = data.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
    pdf.text(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 1.2, {
      align: "center",
    })
  }
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(photoX, photoY, photoSize, photoSize, 0.8, 0.8)

  // QR bottom-right of body (matches screen self-end)
  const qrSize = 11.5
  const qrX = W - pad - qrSize
  const qrY = bodyBottom - 2.2 - qrSize

  const verifyUrl = data.alumniId
    ? `${window.location.origin}/alumni/verify/${encodeURIComponent(data.alumniId)}`
    : null
  let qrDataUrl: string | null = null
  if (verifyUrl) {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#081b45", light: "#ffffff" },
    })
  } else if (data.qrCodeUrl) {
    qrDataUrl = await loadImageDataUrl(data.qrCodeUrl)
  }

  pdf.setFillColor(255, 255, 255)
  pdf.setDrawColor(...BORDER)
  pdf.roundedRect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1, 0.5, 0.5, "FD")
  if (qrDataUrl) addImage(pdf, qrDataUrl, qrX, qrY, qrSize, qrSize)

  // Details column (between photo and QR)
  const textX = photoX + photoSize + 3.2
  const textMax = qrX - textX - 2.5

  pdf.setTextColor(...TEAL)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(4.2)
  pdf.text("VERIFIED ALUMNI", textX, headerH + 4.8)

  pdf.setTextColor(...NAVY)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10.5)
  pdf.text(truncate(data.fullName, 24), textX, headerH + 9.2, {
    maxWidth: textMax,
  })

  if (data.registrationRollNumber) {
    pdf.setTextColor(...SLATE)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6.5)
    pdf.text(`Roll ${data.registrationRollNumber}`, textX, headerH + 12.6)
  }

  // Divider
  const fieldsTop = headerH + 15.8
  pdf.setDrawColor(...LINE)
  pdf.setLineWidth(0.2)
  pdf.line(textX, fieldsTop - 1.8, textX + Math.min(textMax, 42), fieldsTop - 1.8)

  // 2×2 fields — fixed row gap so Degree never hits Campus
  const colW = 20
  const colGap = 21.5
  const rowGap = 8.2
  const fields: Array<[string, string]> = [
    ["Degree", degreeShort(data.degreeLabel)],
    ["Graduation", data.graduationYear ?? "—"],
    ["Campus", campusLabel(data)],
    ["CNIC", maskCnic(data.cnic)],
  ]
  fields.forEach(([label, value], i) => {
    const x = textX + (i % 2) * colGap
    const y = fieldsTop + Math.floor(i / 2) * rowGap
    drawField(pdf, label, value, x, y, colW)
  })

  // ——— Footer (WHITE — same as screen) ———
  const footerY = bodyBottom
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, footerY, W, footerH, "F")
  pdf.setDrawColor(...LINE)
  pdf.setLineWidth(0.25)
  pdf.line(0, footerY, W, footerY)

  const year = new Date().getFullYear()
  pdf.setTextColor(...SLATE)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(4)
  pdf.text(`ALUMNI ID · ${year}`, pad, footerY + 2.8)

  pdf.setTextColor(...NAVY)
  pdf.setFontSize(5.8)
  pdf.text(shortAlumniId(data.alumniId), pad, footerY + 5.5)

  pdf.setTextColor(...MUTED)
  pdf.setFontSize(4)
  pdf.text("IQRA UNIVERSITY", W - pad, footerY + 4.2, { align: "right" })

  // ——— Tri-color accent (full width, same ratios as screen) ———
  pdf.setFillColor(...NAVY)
  pdf.rect(0, H - accentH, W * 0.34, accentH, "F")
  pdf.setFillColor(...TEAL)
  pdf.rect(W * 0.34, H - accentH, W * 0.33, accentH, "F")
  pdf.setFillColor(...TEAL_LIGHT)
  pdf.rect(W * 0.67, H - accentH, W * 0.33, accentH, "F")

  pdf.save(fileName)
}
