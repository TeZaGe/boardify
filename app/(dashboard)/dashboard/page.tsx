import { Sidebar } from '@/components/shared/sidebar'
import { BoardView } from '@/components/dashboard/board-view'
import { JobService } from '@/services/jobs'
import { KanbanColumn } from '@/types'

// Forcer le rendu dynamique côté serveur
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // 1. Récupère ou crée l'utilisateur de démo
  const user = await JobService.getOrCreateDemoUser()
  
  // 2. Récupère les colonnes et offres d'emploi dynamiquement depuis la base de données PostgreSQL
  const columnsData = await JobService.getBoardData(user.id)
  
  // 3. Conversion du type récupéré vers le type TypeScript KanbanColumn attendu par le client
  const columns = columnsData as unknown as KanbanColumn[]

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />
      <BoardView initialColumns={columns} userId={user.id} />
    </div>
  )
}
