import { useEffect, useId, useRef, useState } from "react"
import { ImagePlusIcon, LoaderCircleIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ACCEPT = "image/jpeg,image/png,image/webp"
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_BYTES = 5 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ImageFilePickerProps = {
  previewUrl: string | null
  uploading?: boolean
  disabled?: boolean
  layout?: "fill" | "video"
  className?: string
  onSelect: (file: File) => void
  onClear?: () => void
}

export function ImageFilePicker({
  previewUrl,
  uploading = false,
  disabled = false,
  layout = "video",
  className,
  onSelect,
  onClear,
}: ImageFilePickerProps) {
  const generatedId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCount = useRef(0)
  const localUrlRef = useRef<string | null>(null)

  const [dragging, setDragging] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null,
  )
  const [localError, setLocalError] = useState("")

  const preview = localPreview ?? previewUrl
  const busy = disabled || uploading

  useEffect(() => {
    return () => {
      if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current)
    }
  }, [])

  function openPicker() {
    if (busy) return
    inputRef.current?.click()
  }

  function applyFile(file: File | undefined) {
    if (!file || busy) return

    if (!ALLOWED_TYPES.has(file.type)) {
      setLocalError("Use a JPEG, PNG, or WEBP image")
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError("Image must be 5MB or smaller")
      return
    }

    setLocalError("")
    if (localUrlRef.current) URL.revokeObjectURL(localUrlRef.current)
    const url = URL.createObjectURL(file)
    localUrlRef.current = url
    setLocalPreview(url)
    setFileMeta({ name: file.name, size: file.size })
    onSelect(file)
  }

  function clear() {
    if (busy) return
    setLocalError("")
    setFileMeta(null)
    setLocalPreview(null)
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current)
      localUrlRef.current = null
    }
    if (inputRef.current) inputRef.current.value = ""
    onClear?.()
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <input
        ref={inputRef}
        id={generatedId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          applyFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />

      {preview ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted/30",
            layout === "fill" && "flex min-h-40 flex-1 flex-col",
            layout === "video" && "aspect-video",
          )}
        >
          <img
            src={preview}
            alt="Cover preview"
            className={cn(
              "w-full",
              layout === "fill" && "h-full min-h-40 flex-1 object-contain",
              layout === "video" && "h-full object-cover",
            )}
          />
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70">
              <LoaderCircleIcon className="size-6 animate-spin text-foreground" />
              <p className="text-sm font-medium">Uploading…</p>
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-background/90 via-background/70 to-transparent p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {fileMeta?.name ?? "Cover image"}
              </p>
              <p className="text-xs text-muted-foreground">
                {fileMeta
                  ? formatBytes(fileMeta.size)
                  : "JPEG, PNG, or WEBP"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={openPicker}
              >
                Change
              </Button>
              {onClear ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={clear}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          onDragEnter={(event) => {
            event.preventDefault()
            dragCount.current += 1
            setDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault()
            dragCount.current = Math.max(0, dragCount.current - 1)
            if (dragCount.current === 0) setDragging(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            dragCount.current = 0
            setDragging(false)
            applyFile(event.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            layout === "fill" && "min-h-40 flex-1",
            layout === "video" && "aspect-video",
            dragging
              ? "border-ring bg-muted/70 ring-3 ring-ring/40"
              : "border-input bg-muted/30 hover:border-ring/60 hover:bg-muted/50",
            busy && "pointer-events-none opacity-50",
          )}
        >
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              dragging ? "bg-background text-foreground" : "bg-background text-muted-foreground",
            )}
          >
            {dragging ? (
              <UploadIcon className="size-5" />
            ) : (
              <ImagePlusIcon className="size-5" />
            )}
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              {dragging ? "Drop image to upload" : "Drop an image here, or browse"}
            </span>
            <span className="block text-xs text-muted-foreground">
              JPEG, PNG, or WEBP · up to 5MB
            </span>
          </span>
          <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium">
            Choose image
          </span>
        </button>
      )}

      {localError ? (
        <p className="text-sm text-destructive">{localError}</p>
      ) : uploading && !preview ? (
        <p className="text-xs text-foreground">Uploading…</p>
      ) : null}
    </div>
  )
}
