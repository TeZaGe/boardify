import { Sidebar } from '@/components/shared/sidebar'
import { CompanyView } from '@/components/company/company-view'
import { CompanyService } from '@/services/companies'
import { JobService } from '@/services/jobs'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function CompanyDetailPage({ params }: { params: Promise<Params> }) {
  // Await the dynamic params promise
  const resolvedParams = await params
  const idOrName = resolvedParams.id

  // 1. Récupère l'utilisateur de démo
  const user = await JobService.getOrCreateDemoUser()

  // 2. Charge les vraies données de l'entreprise depuis la base PostgreSQL
  const companyData = await CompanyService.getById(idOrName, user.id)

  if (!companyData) {
    return (
      <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-10 flex flex-col justify-center items-center text-center">
          <Building2 size={48} className="text-text-muted mb-4 opacity-50" />
          <h2 className="font-display font-bold text-2xl mb-2">Entreprise introuvable</h2>
          <p className="text-text-muted text-sm max-w-[320px] mb-6">
            L'entreprise "{idOrName}" n'existe pas ou n'a pas encore de candidatures rattachées.
          </p>
          <Link 
            href="/company" 
            className="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-semibold border border-primary/20 bg-primary/5 hover:bg-primary/10 py-2.5 px-5 rounded-xl transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
        </main>
      </div>
    )
  }

  // Cast pour correspondre au typage attendu
  const company = companyData as any

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />
      <CompanyView company={company} userId={user.id} />
    </div>
  )
}
