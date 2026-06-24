import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SettingsView } from '@/components/settings/settings-view'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id

  // Récupérer le token d'extension
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { extensionToken: true, name: true, email: true, image: true }
  })

  return (
    <SettingsView
      user={{
        name: user?.name ?? session.user?.name ?? null,
        email: user?.email ?? session.user?.email ?? null,
        image: user?.image ?? session.user?.image ?? null,
        extensionToken: user?.extensionToken ?? null,
      }}
    />
  )
}
