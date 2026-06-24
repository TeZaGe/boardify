import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { BoardService } from '@/services/boards'

// ──────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────────────────────────────────────

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().max(10).optional(),
  description: z.string().max(500).optional()
})

// ──────────────────────────────────────────────────────────────────────────────
// Route context type
// ──────────────────────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> }

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/boards/[id] — retrieve a board with full kanban data
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    const { id } = await params
    const board = await BoardService.getById(id, session.user.id)

    if (!board) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tableau introuvable.' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ board })
  } catch (e) {
    console.error('GET /api/boards/[id] error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération du tableau.' } },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/boards/[id] — update board name / emoji / description
// ──────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = updateBoardSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Données invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const { id } = await params
    const board = await BoardService.update(id, session.user.id, validation.data)
    return NextResponse.json({ board })
  } catch (e) {
    console.error('PATCH /api/boards/[id] error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la mise à jour du tableau.' } },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/boards/[id] — delete a board (cascade via Prisma schema)
// ──────────────────────────────────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    const { id } = await params
    await BoardService.delete(id, session.user.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('DELETE /api/boards/[id] error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression du tableau.' } },
      { status: 500 }
    )
  }
}
