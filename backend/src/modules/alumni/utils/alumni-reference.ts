/**
 * Human-readable alumni reference: ALM-2026-0003847
 */
export function formatAlumniReference(year: number, sequence: number): string {
  return `ALM-${year}-${String(sequence).padStart(7, '0')}`;
}

export function parseAlumniReferenceSequence(
  reference: string | null | undefined,
): number | null {
  if (!reference) return null;
  const match = /^ALM-(\d{4})-(\d{7})$/.exec(reference.trim());
  if (!match) return null;
  return Number(match[2]);
}
