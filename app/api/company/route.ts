import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const companies = await db.company.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            jobApplications: { where: { deletedAt: null } },
            contacts: true,
          }
        },
        jobApplications: {
          where: { deletedAt: null },
          select: { id: true, title: true, column: { select: { name: true, color: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ companies })
  } catch (e) {
    console.error('GET /api/company error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()
    const validation = createCompanySchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    const company = await db.company.upsert({
      where: { userId_name: { userId, name: validation.data.name } },
      create: { name: validation.data.name, website: validation.data.website ?? null, userId },
      update: { website: validation.data.website ?? undefined },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (e) {
    console.error('POST /api/company error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
