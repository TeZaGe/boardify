import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine des classes Tailwind de manière conditionnelle et fusionne les conflits.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
