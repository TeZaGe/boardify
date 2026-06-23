import { Sidebar } from '@/components/shared/sidebar'
import { Building2, Search, ArrowUpRight, Clock, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { CompanyService } from '@/services/companies'
import { JobService } from '@/services/jobs'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  // 1. Récupère l'utilisateur
  const user = await JobService.getOrCreateDemoUser()

  // 2. Charge les vraies entreprises depuis la base de données
  const companies = await CompanyService.getAllByUserId(user.id)

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Panneau principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barre de recherche */}
        <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-[320px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              placeholder="Rechercher une entreprise..." 
            />
          </div>
        </header>

        {/* Grille des entreprises */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="flex items-center gap-3 mb-8">
            <Building2 size={24} className="text-primary" />
            <h1 className="font-display font-bold text-3xl tracking-tight">Entreprises Suivies</h1>
          </div>

          {companies.length === 0 ? (
            <div className="h-[300px] border border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-10 text-center opacity-60">
              <Building2 size={48} className="text-text-muted mb-4 animate-pulse" />
              <h3 className="font-semibold text-lg mb-1">Aucune entreprise suivie</h3>
              <p className="text-sm text-text-muted max-w-[340px]">
                Ajoutez des candidatures depuis votre tableau de bord ou l'extension pour commencer à suivre des entreprises.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div 
                  key={company.id}
                  className="bg-card-bg border border-border-color rounded-2xl p-6 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-black/20"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-extrabold text-2xl shadow-md bg-black text-white">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg leading-tight mb-1">{company.name}</h3>
                          <span className="text-xs text-text-muted">{company.website || 'Aucun site enregistré'}</span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/company/${company.id}`}
                        className="p-2 rounded-lg bg-foreground/3 hover:bg-primary/10 border border-border-color hover:border-primary/20 text-text-muted hover:text-primary transition-all duration-150"
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2.5 border-t border-border-color pt-4 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} />
                        <span>{company._count.jobApplications} candidature{company._count.jobApplications > 1 ? 's' : ''} active{company._count.jobApplications > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>Temps de réponse : <strong className="text-foreground">Calcul en cours...</strong></span>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/company/${company.id}`}
                    className="mt-6 w-full text-center bg-foreground/4 border border-border-color hover:bg-primary/10 hover:border-primary/20 hover:text-purple-400 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 block"
                  >
                    Voir la fiche entreprise
                  </Link>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
