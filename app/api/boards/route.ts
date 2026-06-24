import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { BoardService } from '@/services/boards'

// ──────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────────────────────────────────────

const createBoardSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  emoji: z.string().max(10).optional(),
  description: z.string().max(500).optional()
})

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/boards — list all boards for the authenticated user
// ──────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    const boards = await BoardService.getAll(session.user.id)
    return NextResponse.json({ boards })
  } catch (e) {
    console.error('GET /api/boards error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération des tableaux.' } },
      { status: 500 }
    )
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/boards — create a new board
// ──────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createBoardSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Données invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const board = await BoardService.create(session.user.id, validation.data)
    return NextResponse.json({ board }, { status: 201 })
  } catch (e) {
    console.error('POST /api/boards error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création du tableau.' } },
      { status: 500 }
    )
  }
}
