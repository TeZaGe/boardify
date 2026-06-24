import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { db } from '@/lib/db'

// Layout partagé pour toutes les pages du dashboard (auth guard + sidebar)
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  
  const userId = session.user.id
  
  // Requête des statistiques pour la sidebar
  const [boardCount, companyCount, pendingTasksCount] = await Promise.all([
    db.board.count({ where: { userId } }),
    db.company.count({ where: { userId } }),
    db.event.count({
      where: {
        completed: false,
        jobApplication: { userId }
      }
    })
  ])

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar 
        user={session.user} 
        stats={{
          boards: boardCount,
          companies: companyCount,
          tasks: pendingTasksCount
        }}
      />
      {children}
    </div>
  )
}
