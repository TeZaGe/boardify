import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Server action to trigger Google sign-in.
 * Used by the login page form.
 */
export async function getSession() {
  return auth()
}
