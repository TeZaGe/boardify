import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// POST /api/auth/token — Régénère le token d'extension
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const newToken = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')

    await db.user.update({
      where: { id: session.user.id },
      data: { extensionToken: newToken },
    })

    return NextResponse.json({ token: newToken })
  } catch (e) {
    console.error('POST /api/auth/token error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
