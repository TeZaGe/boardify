import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// DELETE /api/boards/[id]/clear — Supprime toutes les candidatures du tableau
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const { id: boardId } = await params

    // Vérifie que le tableau appartient bien à l'utilisateur
    const board = await db.board.findFirst({
      where: { id: boardId, userId }
    })

    if (!board) {
      return NextResponse.json({ error: 'Tableau introuvable.' }, { status: 404 })
    }

    // Supprime toutes les candidatures rattachées aux colonnes de ce tableau
    await db.jobApplication.deleteMany({
      where: {
        userId,
        column: {
          boardId
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Le tableau a été vidé.' })
  } catch (err) {
    console.error('Clear board error:', err)
    return NextResponse.json({ error: 'Erreur lors du nettoyage du tableau.' }, { status: 500 })
  }
}
