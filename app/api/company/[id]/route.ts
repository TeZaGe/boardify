import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // 1. Authentification via session OAuth
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // 2. Vérification de la propriété de l'entreprise
    const existingCompany = await db.company.findFirst({
      where: { id, userId }
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entreprise introuvable.' } },
        { status: 404 }
      )
    }

    // 3. Suppression définitive (avec cascade Prisma vers les offres rattachées)
    await db.company.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Entreprise et candidatures associées supprimées définitivement.' })
  } catch (e) {
    console.error('API Delete Company Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression de l\'entreprise.' } },
      { status: 500 }
    )
  }
}
