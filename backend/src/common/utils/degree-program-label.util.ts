import { SEED_CATALOG } from '../../database/seeds/catalog.seed';

export function formatDegreeProgramName(parts: {
  degreeCode?: string | null;
  programName?: string | null;
}): string | null {
  const name = [parts.degreeCode, parts.programName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
  return name || null;
}

export function degreeProgramNameFromSeed(
  degreeProgramId: string,
): string | null {
  const offering = SEED_CATALOG.degree_programs.find(
    (dp) => dp.id === degreeProgramId,
  );
  if (!offering) return null;

  const degree = SEED_CATALOG.degrees.find((d) => d.id === offering.degree_id);
  const program = SEED_CATALOG.programs.find(
    (p) => p.id === offering.program_id,
  );

  return (
    formatDegreeProgramName({
      degreeCode: degree?.code,
      programName: program?.name,
    }) ?? offering.label.split(' — ')[0] ?? offering.label
  );
}
