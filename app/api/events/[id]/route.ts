import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // Vérifie la propriété de l'événement
    const event = await db.event.findFirst({
      where: {
        id,
        jobApplication: {
          userId
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Événement introuvable.' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const completed = body.completed === true

    const updatedEvent = await db.event.update({
      where: { id },
      data: { completed }
    })

    return NextResponse.json({ success: true, event: updatedEvent })
  } catch (e) {
    console.error('API Update Event Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour de l\'événement.' } },
      { status: 500 }
    )
  }
}
