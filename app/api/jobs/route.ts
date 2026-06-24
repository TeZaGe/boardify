import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { JobService } from '@/services/jobs'
import { auth } from '@/auth'

// Définition du schéma de validation de la candidature
const addJobSchema = z.object({
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(100),
  location: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  url: z.string().max(1000).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  appliedAt: z.string().optional().nullable()
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification — Extension Token OU Session Google
    let userId: string | null = null

    // Priorité 1 : Token d'extension (pour l'extension de navigateur)
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const userByToken = await db.user.findUnique({
        where: { extensionToken: token },
        select: { id: true }
      })
      if (userByToken) {
        userId = userByToken.id
      }
    }

    // Priorité 2 : Session NextAuth
    if (!userId) {
      const session = await auth()
      if (session?.user?.id) {
        userId = session.user.id
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentification requise.' } },
        { status: 401 }
      )
    }

    // 2. Validation du corps de requête
    const body = await request.json()
    const validation = addJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Champs de candidature invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const jobData = validation.data

    // 3. Trouver la première colonne Kanban (tableau par défaut)
    let firstColumn = await db.column.findFirst({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    // Si l'utilisateur n'a pas de colonnes, on initialise son tableau de bord
    if (!firstColumn) {
      const columns = await JobService.getBoardData(userId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstColumn = (columns[0] as any) ?? null
    }

    if (!firstColumn) {
      return NextResponse.json(
        { error: { code: 'NO_COLUMNS', message: 'Aucun tableau trouvé pour cet utilisateur.' } },
        { status: 400 }
      )
    }

    // 4. Calculer le prochain ordre dans cette colonne
    const maxOrderJob = await db.jobApplication.findFirst({
      where: { userId, columnId: firstColumn.id },
      orderBy: { order: 'desc' }
    })
    const nextOrder = maxOrderJob ? maxOrderJob.order + 1 : 1

    // 5. Création de l'offre
    const job = await JobService.create(userId, {
      title: jobData.title,
      companyName: jobData.companyName,
      location: jobData.location ?? undefined,
      description: jobData.description ?? undefined,
      url: jobData.url ?? undefined,
      salary: jobData.salary ?? undefined,
      source: jobData.source ?? 'Scraper Extension',
      columnId: firstColumn.id,
      order: nextOrder,
      appliedAt: jobData.appliedAt ? new Date(jobData.appliedAt) : undefined
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (e) {
    console.error('API Add Job Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la création de la candidature.' } },
      { status: 500 }
    )
  }
}
