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

    // Vérifie la propriété de l'événement directement via userId
    const event = await db.event.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Événement introuvable.' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { completed, title, type, date, jobApplicationId } = body

    const data: any = {}
    if (completed !== undefined) data.completed = completed === true
    if (title !== undefined) data.title = title
    if (type !== undefined) data.type = type
    if (date !== undefined) data.date = new Date(date)
    if (jobApplicationId !== undefined) data.jobApplicationId = jobApplicationId || null

    const updatedEvent = await db.event.update({
      where: { id },
      data
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

export async function DELETE(
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
        userId
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Événement introuvable.' } },
        { status: 404 }
      )
    }

    await db.event.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('API Delete Event Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression de l\'événement.' } },
      { status: 500 }
    )
  }
}
