/**
 * Builds a human-readable alumni registration reference:
 * ARR-YYYYMMDD-XXXXX
 */
export function generateRegistrationRef(sequence = randomSuffix()): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `ARR-${yyyy}${mm}${dd}-${sequence}`;
}

function randomSuffix(length = 5): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}
