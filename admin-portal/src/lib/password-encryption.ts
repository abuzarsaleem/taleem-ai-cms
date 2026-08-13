function normalizePublicKey(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  if (trimmed.includes("BEGIN PUBLIC KEY")) {
    return trimmed
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s/g, "")
  }

  return trimmed.replace(/\s/g, "")
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function importPublicKey(publicKeyMaterial: string): Promise<CryptoKey> {
  const normalized = normalizePublicKey(publicKeyMaterial)
  if (!normalized) {
    throw new Error("Public encryption key is not configured")
  }

  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(normalized),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  )
}

let cachedPublicKey: CryptoKey | null = null
let cachedKeyMaterial = ""

export async function encryptPassword(plainPassword: string): Promise<string> {
  const publicKeyMaterial = import.meta.env.VITE_ENCRYPTION_KEY
  if (!publicKeyMaterial?.trim()) {
    throw new Error("VITE_ENCRYPTION_KEY is not configured")
  }

  if (!cachedPublicKey || cachedKeyMaterial !== publicKeyMaterial) {
    cachedPublicKey = await importPublicKey(publicKeyMaterial)
    cachedKeyMaterial = publicKeyMaterial
  }

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    cachedPublicKey,
    new TextEncoder().encode(plainPassword),
  )

  return arrayBufferToBase64(encrypted)
}
