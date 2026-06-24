import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { BoardsView } from '@/components/boards/boards-view'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BoardsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id

  // Récupérer tous les tableaux avec comptages
  const boards = await db.board.findMany({
    where: { userId },
    include: {
      columns: {
        include: {
          _count: {
            select: { jobApplications: { where: { deletedAt: null } } }
          }
        }
      }
    },
    orderBy: { order: 'asc' },
  })

  // Si aucun tableau, en créer un par défaut
  if (boards.length === 0) {
    const defaultBoard = await db.board.create({
      data: {
        name: 'Ma recherche d\'emploi',
        emoji: '🚀',
        isDefault: true,
        order: 0,
        userId,
        columns: {
          create: [
            { name: 'À postuler', order: 0, color: '#6b7280', userId },
            { name: 'Postulé', order: 1, color: '#3b82f6', userId },
            { name: 'Entretien', order: 2, color: '#f59e0b', userId },
            { name: 'Offre reçue', order: 3, color: '#10b981', userId },
            { name: 'Refusé', order: 4, color: '#ef4444', userId },
          ]
        }
      },
      include: {
        columns: {
          include: {
            _count: {
              select: { jobApplications: { where: { deletedAt: null } } }
            }
          }
        }
      }
    })
    boards.push(defaultBoard)
  }

  const boardsData = boards.map((board: any) => ({
    id: board.id,
    name: board.name,
    emoji: board.emoji,
    description: board.description,
    isDefault: board.isDefault,
    jobCount: board.columns.reduce((sum, col) => sum + col._count.jobApplications, 0),
    columnCount: board.columns.length,
    createdAt: board.createdAt.toISOString(),
  }))

  return <BoardsView boards={boardsData} userId={userId} />
}
