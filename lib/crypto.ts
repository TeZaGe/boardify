import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Hashes a password using Node's native scrypt algorithm.
 * Returns a string in the format salt:hash.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hashedPassword = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hashedPassword}`
}

/**
 * Verifies a password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false
    const hashedBuffer = scryptSync(password, salt, 64)
    const keyBuffer = Buffer.from(key, 'hex')
    return timingSafeEqual(hashedBuffer, keyBuffer)
  } catch (e) {
    return false
  }
}
