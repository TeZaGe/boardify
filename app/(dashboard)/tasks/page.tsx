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

  // 2. Récupère tous les événements planifiés
  const events = await db.event.findMany({
    where: {
      jobApplication: {
        userId,
        deletedAt: null
      }
    },
    include: {
      jobApplication: {
        include: {
          company: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  return <TasksView initialJobs={jobs} initialEvents={events} />
}
