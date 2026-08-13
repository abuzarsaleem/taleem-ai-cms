let cachedKey: CryptoKey | null = null
let loadingKey: Promise<CryptoKey> | null = null

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "")

  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

async function loadPublicKeyPem(): Promise<string> {
  const fromEnv = import.meta.env.VITE_PASSWORD_PUBLIC_KEY as string | undefined
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\\n/g, "\n")
  }

  const response = await fetch("/taleem-public.pem")
  if (!response.ok) {
    throw new Error("Failed to load password public key")
  }
  return (await response.text()).trim()
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  if (!loadingKey) {
    loadingKey = (async () => {
      const pem = await loadPublicKeyPem()
      const key = await crypto.subtle.importKey(
        "spki",
        pemToArrayBuffer(pem),
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"],
      )
      cachedKey = key
      return key
    })().catch((error) => {
      loadingKey = null
      throw error
    })
  }
  return loadingKey
}

/**
 * Encrypt a password with RSA-OAEP-SHA256 for backend transport.
 * Returns base64 ciphertext expected by /auth/login and /auth/reset-password.
 */
export async function encryptPassword(plainPassword: string): Promise<string> {
  if (!plainPassword) {
    throw new Error("Password is required")
  }

  const key = await getPublicKey()
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(plainPassword),
  )
  return bufferToBase64(encrypted)
}
