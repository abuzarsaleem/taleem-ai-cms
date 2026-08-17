import { GraduationCap } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AlumniIdCardData = {
  fullName: string;
  photoUrl?: string | null;
  degreeLabel?: string | null;
  graduationYear?: string | null;
  registrationRollNumber?: string | null;
};

type AlumniIdCardProps = {
  data: AlumniIdCardData;
  className?: string;
  showQr?: boolean;
  qrCodeUrl?: string | null;
};

function CornerAccents() {
  return (
    <>
      <div className="pointer-events-none absolute top-0 left-0" aria-hidden>
        <div className="absolute top-0 left-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute top-0 left-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute top-[6px] left-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute top-[6px] left-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      <div className="pointer-events-none absolute top-0 right-0" aria-hidden>
        <div className="absolute top-0 right-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute top-0 right-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute top-[6px] right-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute top-[6px] right-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0" aria-hidden>
        <div className="absolute bottom-0 left-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute bottom-0 left-[22px] h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute bottom-[6px] left-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute bottom-[6px] left-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
      <div className="pointer-events-none absolute right-0 bottom-0" aria-hidden>
        <div className="absolute right-0 bottom-0 h-[72px] w-[18px] bg-[#0b4d3c]" />
        <div className="absolute right-[22px] bottom-0 h-[18px] w-[72px] bg-[#0b4d3c]" />
        <div className="absolute right-[6px] bottom-[6px] h-[52px] w-[8px] bg-[#c9a227]" />
        <div className="absolute right-[6px] bottom-[6px] h-[8px] w-[52px] bg-[#c9a227]" />
      </div>
    </>
  );
}

export function AlumniIdCard({
  data,
  className,
  showQr = false,
  qrCodeUrl,
}: AlumniIdCardProps) {
  const degreeShort =
    data.degreeLabel?.split(' — ')[0] ?? data.degreeLabel ?? 'Alumni member';
  const initials = data.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const hasQr = showQr && Boolean(qrCodeUrl);

  return (
    <div
      className={cn('mx-auto w-full max-w-[340px]', className)}
    >
      <div
        className="relative overflow-hidden rounded-[14px] bg-white"
        style={{
          aspectRatio: showQr ? '54 / 86' : '54 / 72',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -20px rgba(11,77,60,0.45), 0 6px 16px rgba(15,23,42,0.08)',
        }}
      >
        <CornerAccents />

        <div className="relative flex h-full flex-col items-center px-7 pt-9 pb-8">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0b4d3c] text-[#c9a227] shadow-sm">
              <GraduationCap className="size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 text-right">
              <p className="font-display text-[17px] leading-none font-bold tracking-[0.04em] text-[#0b4d3c] uppercase">
                Taleem
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-[#0b4d3c]/80 uppercase">
                Alumni
              </p>
            </div>
          </div>

          <div className="mt-8">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.fullName}
                className="size-[118px] rounded-full object-cover ring-[3px] ring-[#0b4d3c] sm:size-[118px]"
              />
            ) : (
              <div className="flex size-[118px] items-center justify-center rounded-full bg-[#0b4d3c]/10 text-3xl font-semibold text-[#0b4d3c] ring-[3px] ring-[#0b4d3c]">
                {initials}
              </div>
            )}
          </div>

          <div className="mt-5 w-full text-center">
            <h2 className="text-[20px] leading-tight font-bold tracking-wide text-[#0b4d3c] uppercase">
              {data.fullName}
            </h2>
            <p className="mt-2 text-[11px] font-medium tracking-[0.18em] text-[#0b4d3c]/75 uppercase">
              {degreeShort}
              {data.graduationYear ? ` · ${data.graduationYear}` : ''}
            </p>
            {data.registrationRollNumber ? (
              <p className="mt-1.5 text-[11px] text-[#0b4d3c]/55">
                Roll # {data.registrationRollNumber}
              </p>
            ) : null}
          </div>

          {showQr ? (
            <div className="mt-auto flex flex-col items-center pt-5">
              <div className="rounded-md bg-white p-1.5 ring-1 ring-[#0b4d3c]/15">
                {hasQr ? (
                  <img
                    src={qrCodeUrl!}
                    alt="Alumni verification QR"
                    className="size-[108px]"
                  />
                ) : (
                  <div className="flex size-[108px] items-center justify-center bg-[#0b4d3c]/5 px-3 text-center text-[11px] leading-snug text-[#0b4d3c]/60">
                    QR not issued yet
                  </div>
                )}
              </div>

              <p className="mt-4 text-[15px] font-bold tracking-[0.28em] text-[#0b4d3c] uppercase">
                Alumni
              </p>
              <p className="mt-1 text-[10px] tracking-wide text-[#0b4d3c]/45">
                {hasQr
                  ? 'Scan to verify identity'
                  : 'Issued after university approval'}
              </p>
            </div>
          ) : (
            <p className="mt-auto pt-5 text-[15px] font-bold tracking-[0.28em] text-[#0b4d3c] uppercase">
              Alumni
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
