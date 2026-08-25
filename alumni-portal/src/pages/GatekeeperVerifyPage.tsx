import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlumniIdCard } from '@/components/alumni-id-card';
import { BrandLogo } from '@/components/brand-logo';
import {
  verifyAlumniCard,
  type AlumniVerifyResponse,
} from '@/services/verify.service';
import { BadgeCheck, ShieldAlert, Loader2 } from 'lucide-react';

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: AlumniVerifyResponse };

function formatVerifiedAt(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function GatekeeperVerifyPage() {
  const { alumniId } = useParams<{ alumniId: string }>();
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  useEffect(() => {
    if (!alumniId) {
      setState({ kind: 'error', message: 'Invalid verification link.' });
      return;
    }

    let cancelled = false;

    verifyAlumniCard(alumniId)
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: 'Unable to verify this alumni card. Please try again.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [alumniId]);

  const isValid = state.kind === 'ready' && state.data.is_valid;
  const verifiedAt =
    state.kind === 'ready' ? formatVerifiedAt(state.data.verified_at) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <header className="border-b border-emerald-900/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <BrandLogo className="h-10" />
            <h1 className="mt-2 text-lg font-semibold text-emerald-950 sm:text-xl">
              Alumni verification
            </h1>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
            Gatekeeper
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-5xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-12">
        {state.kind === "loading" ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
            <p>Verifying alumni card…</p>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
            <h2 className="mt-4 text-lg font-semibold text-red-950">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start lg:gap-10">
            <section className="flex min-w-0 justify-center lg:justify-start">
              {isValid && state.data.full_name ? (
                <AlumniIdCard
                  className="w-full"
                  data={{
                    fullName: state.data.full_name,
                    photoUrl: state.data.photo_url,
                    degreeLabel: state.data.degree_label,
                    graduationYear: state.data.graduation_year,
                    registrationRollNumber: state.data.registration_roll_number,
                    alumniId: state.data.public_alumni_code ?? alumniId,
                  }}
                />
              ) : (
                <div className="flex w-full max-w-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white p-8 text-center shadow-sm sm:max-w-[360px]">
                  <ShieldAlert className="h-10 w-10 text-red-600" />
                  <p className="mt-4 text-base font-semibold text-red-950">
                    Invalid card
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {state.data.message ??
                      "This alumni card could not be verified."}
                  </p>
                </div>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                {isValid ? (
                  <BadgeCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
                ) : (
                  <ShieldAlert className="mt-0.5 h-8 w-8 shrink-0 text-red-600" />
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">
                    {isValid ? 'Verified alumni' : 'Not verified'}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {state.data.message ??
                      (isValid
                        ? 'This card is active and belongs to a registered Taleem alumnus.'
                        : 'Do not grant access based on this scan.')}
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 border-t border-emerald-900/10 pt-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                    {state.data.status ?? "Unknown"}
                  </dd>
                </div>
                {verifiedAt ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Verified at
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {verifiedAt}
                    </dd>
                  </div>
                ) : null}
                {isValid && state.data.full_name ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Name
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {state.data.full_name}
                    </dd>
                  </div>
                ) : null}
                {isValid && state.data.public_alumni_code ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Alumni ID
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {state.data.public_alumni_code}
                    </dd>
                  </div>
                ) : null}
                {isValid && state.data.registration_roll_number ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Roll number
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {state.data.registration_roll_number}
                    </dd>
                  </div>
                ) : null}
                {isValid && state.data.degree_label ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Degree
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {state.data.degree_label.split(" — ")[0]}
                    </dd>
                  </div>
                ) : null}
                {isValid && state.data.graduation_year ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Graduation
                    </dt>
                    <dd className="mt-1 text-sm font-medium break-words text-emerald-950">
                      {state.data.graduation_year}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
