import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()
    const { title, type, date, jobApplicationId } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Titre et date obligatoires.' } },
        { status: 400 }
      )
    }

    const event = await db.event.create({
      data: {
        title,
        type: type || 'TASK',
        date: new Date(date),
        userId,
        jobApplicationId: jobApplicationId || null
      }
    })

    return NextResponse.json({ success: true, event })
  } catch (e) {
    console.error('API Create Event Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création de l\'événement.' } },
      { status: 500 }
    )
  }
}
