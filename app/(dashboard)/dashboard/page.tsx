import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AnalyticsView } from '@/components/dashboard/analytics-view'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  return <AnalyticsView />
}
