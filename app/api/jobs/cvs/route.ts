import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // Recherche de tous les documents de type 'CV' appartenant aux candidatures de l'utilisateur
    const cvs = await db.document.findMany({
      where: {
        type: 'CV',
        jobApplication: {
          userId
        }
      },
      select: {
        name: true,
        url: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Élimine les doublons de CV ayant le même nom ou la même URL
    const uniqueCvs: { name: string; url: string }[] = []
    const seen = new Set<string>()

    for (const cv of cvs) {
      const key = `${cv.name}-${cv.url}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueCvs.push(cv)
      }
    }

    return NextResponse.json({ success: true, cvs: uniqueCvs })
  } catch (err) {
    console.error('API Get CVS Error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la récupération des CVs.' } },
      { status: 500 }
    )
  }
}
