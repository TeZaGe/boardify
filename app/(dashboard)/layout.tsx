import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'

// Layout partagé pour toutes les pages du dashboard (auth guard + sidebar)
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar user={session.user} />
      {children}
    </div>
  )
}
