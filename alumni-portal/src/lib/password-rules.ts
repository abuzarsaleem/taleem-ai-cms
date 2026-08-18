export const PASSWORD_HINT =
  "At least 8 characters, with letters, 1 uppercase letter, and 1 number."

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters."
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers."
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least 1 uppercase letter."
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least 1 number."
  }
  return null
}
