import { ShieldCheck } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"

type AuthBrandPanelProps = {
  heading?: string
  description?: string
}

export function AuthBrandPanel({
  heading = "Taleem Alumni Network",
  description = "Your official alumni identity, events, and community — in one secure place.",
}: AuthBrandPanelProps) {
  return (
    <div className="relative hidden overflow-hidden bg-[#081b45] md:block">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(120% 80% at 10% 0%, rgba(54,186,188,0.35) 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, #173b79 0%, transparent 60%)",
        }}
      />
      <div className="absolute top-8 left-8 h-16 w-16 border-t-2 border-l-2 border-[#36babc]/70" />
      <div className="absolute right-8 bottom-8 h-16 w-16 border-r-2 border-b-2 border-[#36babc]/70" />

      <div className="relative flex h-full min-h-[420px] flex-col justify-between p-10 text-white">
        <div className="inline-flex w-fit bg-white px-3 py-2 shadow-sm">
          <BrandLogo className="h-12" />
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
          <ShieldCheck className="size-4 text-[#36babc]" />
          Secure verification for alumni access
        </div>
      </div>
    </div>
  )
}
