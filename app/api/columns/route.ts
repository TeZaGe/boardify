import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'

const createColumnSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(30).optional().nullable()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()
    const validation = createColumnSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Paramètres de colonne invalides.' } },
        { status: 400 }
      )
    }

    const { name, color } = validation.data

    // Calcule le prochain ordre
    const maxOrderCol = await db.column.findFirst({
      where: { userId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = maxOrderCol ? maxOrderCol.order + 1 : 1

    const column = await db.column.create({
      data: {
        name,
        color: color || 'bg-col-to-apply',
        order: nextOrder,
        userId
      }
    })

    return NextResponse.json({ success: true, column }, { status: 201 })
  } catch (e) {
    console.error('API Create Column Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création de la colonne.' } },
      { status: 500 }
    )
  }
}
