import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(30).optional(),
})

// POST /api/boards/[id]/columns — Crée une nouvelle colonne
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const { id: boardId } = await params

    const board = await db.board.findUnique({
      where: { id: boardId, userId },
      select: { id: true }
    })
    if (!board) return NextResponse.json({ error: 'Board non trouvé' }, { status: 404 })

    const body = await request.json()
    const validation = createColumnSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const lastColumn = await db.column.findFirst({
      where: { boardId, userId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const nextOrder = lastColumn ? lastColumn.order + 1 : 0

    const column = await db.column.create({
      data: {
        name: validation.data.name,
        color: validation.data.color ?? '#6b7280',
        order: nextOrder,
        userId,
        boardId,
      }
    })

    return NextResponse.json({ column }, { status: 201 })
  } catch (e) {
    console.error('POST /api/boards/[id]/columns error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
