import { auth } from '@/auth'
import { NextResponse } from 'next/server'

/**
 * Middleware d'authentification global.
 * - Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 *   et tente d'accéder à une route protégée.
 * - L'API de l'extension (/api/extension) est protégée via le token,
 *   pas via la session — on l'exclut donc du middleware.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Exclure les routes publiques et les routes d'API qui ont leur propre auth
  const publicPaths = ['/', '/api/auth', '/api/extension']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (!isPublicPath && !isLoggedIn) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si l'utilisateur est connecté et tente d'accéder à la page de connexion
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
