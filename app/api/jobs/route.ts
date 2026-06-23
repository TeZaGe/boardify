import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { JobService } from '@/services/jobs'

// Définition du schéma de validation de la candidature
const addJobSchema = z.object({
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(100),
  location: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  url: z.string().max(1000).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  source: z.string().max(100).optional().nullable()
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification (Extension Token, Session, ou Demo fallback)
    let userId: string | null = null

    // Lecture du token d'extension dans l'en-tête Authorization
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const userByToken = await db.user.findUnique({
        where: { extensionToken: token }
      })
      if (userByToken) {
        userId = userByToken.id
      }
    }

    // Fallback de développement : Si non authentifié, on utilise le compte de démo
    if (!userId) {
      const demoUser = await JobService.getOrCreateDemoUser()
      userId = demoUser.id
    }

    // 2. Récupération et validation du corps de requête
    const body = await request.json()
    const validation = addJobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Champs de candidature invalides.', details: validation.error.format() } },
        { status: 400 }
      )
    }

    const jobData = validation.data

    // 3. Trouver la première colonne Kanban de l'utilisateur (ex: "À postuler")
    let firstColumn = await db.column.findFirst({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    // Si l'utilisateur n'a pas de colonnes, on initialise son tableau de bord
    if (!firstColumn) {
      const columns = await JobService.getBoardData(userId)
      firstColumn = columns[0]
    }

    // Calculer le prochain ordre dans cette colonne
    const maxOrderJob = await db.jobApplication.findFirst({
      where: { userId, columnId: firstColumn.id },
      orderBy: { order: 'desc' }
    })
    const nextOrder = maxOrderJob ? maxOrderJob.order + 1 : 1

    // 4. Utilisation du service pour créer l'offre
    const job = await JobService.create(userId, {
      title: jobData.title,
      companyName: jobData.companyName,
      location: jobData.location || undefined,
      description: jobData.description || undefined,
      url: jobData.url || undefined,
      salary: jobData.salary || undefined,
      source: jobData.source || 'Scraper Extension',
      columnId: firstColumn.id,
      order: nextOrder
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
