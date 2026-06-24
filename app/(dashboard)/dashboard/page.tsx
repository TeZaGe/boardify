import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BoardService } from '@/services/boards'

export const dynamic = 'force-dynamic'

// Redirige vers le board par défaut de l'utilisateur
export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const userId = session.user.id

  const defaultBoard = await BoardService.getOrCreateDefault(userId)
  redirect(`/dashboard/${defaultBoard.id}`)
}
