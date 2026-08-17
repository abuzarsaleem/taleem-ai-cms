import { GraduationCap, ShieldCheck } from "lucide-react"

type AuthBrandPanelProps = {
  heading?: string
  description?: string
}

export function AuthBrandPanel({
  heading = "Taleem Alumni Network",
  description = "Your official alumni identity, events, and community — in one secure place.",
}: AuthBrandPanelProps) {
  return (
    <div className="relative hidden overflow-hidden bg-[#0b4d3c] md:block">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(120% 80% at 10% 0%, #c9a22755 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, #062e25 0%, transparent 60%)",
        }}
      />
      <div className="absolute top-8 left-8 h-16 w-16 border-t-2 border-l-2 border-[#c9a227]/70" />
      <div className="absolute right-8 bottom-8 h-16 w-16 border-r-2 border-b-2 border-[#c9a227]/70" />

      <div className="relative flex h-full min-h-[420px] flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-[#c9a227] ring-1 ring-[#c9a227]/40">
            <GraduationCap className="size-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-[#c9a227] uppercase">
              Taleem
            </p>
            <p className="text-sm text-white/70">Alumni Portal</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight">
            {heading}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-white/75">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          <ShieldCheck className="size-4 text-[#c9a227]" />
          Secure verification for alumni access
        </div>
      </div>
    </div>
  )
}
