import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'

const updateColumnSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().max(30).optional().nullable(),
  order: z.number().int().optional()
})

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

    // Vérifie que la colonne appartient bien à l'utilisateur
    const existingColumn = await db.column.findFirst({
      where: { id, userId }
    })

    if (!existingColumn) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Colonne introuvable.' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateColumnSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Paramètres invalides.' } },
        { status: 400 }
      )
    }

    const { name, color, order } = validation.data

    // S'il s'agit d'une mise à jour de l'ordre
    if (order !== undefined && order !== existingColumn.order) {
      await db.$transaction(async (tx) => {
        // Trouve la colonne qui occupe actuellement cet ordre
        const targetColumn = await tx.column.findFirst({
          where: { userId, order }
        })

        if (targetColumn) {
          // Temporairement, décale l'ordre de la cible vers un nombre négatif pour éviter la collision unique
          await tx.column.update({
            where: { id: targetColumn.id },
            data: { order: -targetColumn.order }
          })

          // Met à jour la colonne source
          await tx.column.update({
            where: { id },
            data: { order }
          })

          // Restaure la cible à l'ancien ordre de la source
          await tx.column.update({
            where: { id: targetColumn.id },
            data: { order: existingColumn.order }
          })
        } else {
          // Pas de collision
          await tx.column.update({
            where: { id },
            data: { order }
          })
        }
      })
    } else {
      // Mise à jour classique du nom et/ou de la couleur
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (color !== undefined) updateData.color = color

      await db.column.update({
        where: { id },
        data: updateData
      })
    }

    return NextResponse.json({ success: true, message: 'Colonne mise à jour.' })
  } catch (e) {
    console.error('API Update Column Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la modification de la colonne.' } },
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

    // Vérifie l'appartenance
    const existingColumn = await db.column.findFirst({
      where: { id, userId }
    })

    if (!existingColumn) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Colonne introuvable.' } },
        { status: 404 }
      )
    }

    // Suppression définitive de la colonne
    await db.column.delete({
      where: { id }
    })

    // Réorganise les ordres restants pour qu'ils soient consécutifs de 1 à N
    const remainingCols = await db.column.findMany({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    for (let i = 0; i < remainingCols.length; i++) {
      const col = remainingCols[i]
      const newOrder = i + 1
      if (col.order !== newOrder) {
        await db.column.update({
          where: { id: col.id },
          data: { order: newOrder }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Colonne supprimée.' })
  } catch (e) {
    console.error('API Delete Column Error:', e)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Erreur lors de la suppression de la colonne.' } },
      { status: 500 }
    )
  }
}
