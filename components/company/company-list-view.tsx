'use client'

import * as React from 'react'
import { Building2, Search, ArrowUpRight, Clock, Briefcase, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

interface CompanyListViewProps {
  initialCompanies: any[]
}

export function CompanyListView({ initialCompanies }: CompanyListViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name-asc' | 'name-desc' | 'apps-desc' | 'apps-asc'>('name-asc')

  // Calcule les stats pour chaque entreprise (temps de réponse moyen, etc.)
  const companiesWithStats = React.useMemo(() => {
    return initialCompanies.map(company => {
      // Calcul du temps de réponse moyen
      let totalDays = 0
      let count = 0

      for (const job of company.jobApplications || []) {
        if (!job.appliedAt) continue

        const responseHistories = job.history?.filter((h: any) => {
          const name = h.toColumn?.name?.toLowerCase() || ''
          return name.includes('entretien') || name.includes('offre') || name.includes('refus') || name.includes('clôturé')
        }) || []

        let responseDate: Date | null = null

        if (responseHistories.length > 0) {
          const oldest = responseHistories.reduce((min: any, current: any) => 
            new Date(current.changedAt) < new Date(min.changedAt) ? current : min
          , responseHistories[0])
          responseDate = new Date(oldest.changedAt)
        } else {
          const colName = job.column?.name?.toLowerCase() || ''
          if (colName.includes('entretien') || colName.includes('offre') || colName.includes('refus') || colName.includes('clôturé')) {
            responseDate = new Date(job.updatedAt)
          }
        }

        if (responseDate) {
          const diffTime = responseDate.getTime() - new Date(job.appliedAt).getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays >= 0) {
            totalDays += diffDays
            count++
          }
        }
      }

      const averageResponseTime = count > 0 
        ? `${Math.round(totalDays / count)} jour${Math.round(totalDays / count) > 1 ? 's' : ''}` 
        : null

      return {
        ...company,
        averageResponseTime
      }
    })
  }, [initialCompanies])

  // Filtrage
  const filteredCompanies = React.useMemo(() => {
    let result = companiesWithStats

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q))
    }

    // Tri
    result = [...result].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      } else if (sortBy === 'apps-desc') {
        return b._count.jobApplications - a._count.jobApplications
      } else if (sortBy === 'apps-asc') {
        return a._count.jobApplications - b._count.jobApplications
      }
      return 0
    })

    return result
  }, [companiesWithStats, searchQuery, sortBy])

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      
      {/* Barre de recherche et filtres */}
      <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10 gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            placeholder="Rechercher une entreprise..." 
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
            <ArrowUpDown size={14} />
            Trier par :
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-foreground/4 border border-border-color py-2 px-3 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors duration-200"
          >
            <option value="name-asc" className="bg-bg-side">Nom (A-Z)</option>
            <option value="name-desc" className="bg-bg-side">Nom (Z-A)</option>
            <option value="apps-desc" className="bg-bg-side">Candidatures (Décroissant)</option>
            <option value="apps-asc" className="bg-bg-side">Candidatures (Croissant)</option>
          </select>
        </div>
      </header>

      {/* Grille des entreprises */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="flex items-center gap-3 mb-8">
          <Building2 size={24} className="text-primary" />
          <h1 className="font-display font-bold text-3xl tracking-tight">Entreprises Suivies</h1>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="h-[300px] border border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-10 text-center opacity-60">
            <Building2 size={48} className="text-text-muted mb-4 animate-pulse" />
            <h3 className="font-semibold text-lg mb-1">Aucune entreprise trouvée</h3>
            <p className="text-sm text-text-muted max-w-[340px]">
              Ajustez vos filtres ou ajoutez des candidatures pour commencer à suivre des entreprises.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
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
                      <span>
                        Temps de réponse :{' '}
                        {company.averageResponseTime ? (
                          <strong className="text-purple-400">{company.averageResponseTime}</strong>
                        ) : (
                          <span className="text-text-muted italic">Non renseigné</span>
                        )}
                      </span>
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
  )
}
