import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE(
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

    // Vérifie que le document appartient bien à l'utilisateur via la candidature rattachée
    const document = await db.document.findUnique({
      where: { id },
      include: {
        jobApplication: true
      }
    })

    if (!document || document.jobApplication.userId !== userId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Document introuvable.' } },
        { status: 404 }
      )
    }

    // Suppression du fichier sur le disque
    try {
      const filename = path.basename(document.url)
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
      await fs.unlink(filePath)
    } catch (err) {
      console.warn('Physical file not found or delete failed:', err)
    }

    // Suppression en base
    await db.document.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Document supprimé.' })
  } catch (e) {
    console.error('API Delete Document Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression du document.' } },
      { status: 500 }
    )
  }
}
