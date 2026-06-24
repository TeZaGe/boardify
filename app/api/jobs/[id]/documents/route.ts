import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // Authentification via session OAuth
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // Vérifie que la candidature appartient bien à l'utilisateur
    const existingJob = await db.jobApplication.findFirst({
      where: { id, userId }
    })

    if (!existingJob) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Candidature introuvable.' } },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // "CV", "COVER_LETTER", "OTHER"

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Fichier manquant.' } },
        { status: 400 }
      )
    }

    // Sauvegarde physique du fichier dans public/uploads
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, uniqueFilename)
    await fs.writeFile(filePath, buffer)

    const fileUrl = `/uploads/${uniqueFilename}`

    // Création de l'enregistrement en base
    const document = await db.document.create({
      data: {
        name: file.name,
        url: fileUrl,
        type: type || 'OTHER',
        jobApplicationId: id
      }
    })

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (e) {
    console.error('API Upload Document Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors du téléversement du document.' } },
      { status: 500 }
    )
  }
}
