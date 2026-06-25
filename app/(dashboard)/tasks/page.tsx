import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { TasksView } from '@/components/tasks/tasks-view'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const userId = session.user.id

  // 1. Récupère toutes les candidatures actives de l'utilisateur
  const jobs = await db.jobApplication.findMany({
    where: {
      userId,
      deletedAt: null
    },
    include: {
      column: true,
      company: true
    }
  })

  const events = await db.event.findMany({
    where: {
      userId
    },
    include: {
      jobApplication: {
        include: {
          company: true,
          column: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  const defaultBoard = await db.board.findFirst({
    where: { userId, isDefault: true }
  }) || await db.board.findFirst({
    where: { userId }
  })
  const defaultBoardId = defaultBoard?.id || ''

  return <TasksView initialJobs={jobs} initialEvents={events} defaultBoardId={defaultBoardId} />
}

