import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BoardView } from '@/components/dashboard/board-view'
import { JobService } from '@/services/jobs'
import { KanbanColumn } from '@/types'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardBoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const userId = session.user.id

  const { boardId } = await params

  // Vérifie que le board appartient bien à l'utilisateur
  const board = await db.board.findUnique({
    where: { id: boardId, userId },
    select: { id: true, name: true, emoji: true }
  })

  if (!board) redirect('/boards')

  const columnsData = await JobService.getBoardData(userId, boardId)
  const columns = columnsData as unknown as KanbanColumn[]

  return (
    <BoardView
      initialColumns={columns}
      userId={userId}
      boardId={boardId}
      boardName={board.name}
      boardEmoji={board.emoji ?? '📋'}
    />
  )
}
