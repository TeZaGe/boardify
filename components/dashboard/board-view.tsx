'use client'

import * as React from 'react'
import { 
  Plus, 
  Search, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Link as LinkIcon 
} from 'lucide-react'
import Link from 'next/link'
import { KanbanColumn } from '@/types'

interface BoardViewProps {
  initialColumns: KanbanColumn[]
  userId: string
}

export function BoardView({ initialColumns, userId }: BoardViewProps) {
  const [columns, setColumns] = React.useState<KanbanColumn[]>(initialColumns)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Met à jour l'affichage en fonction de la recherche
  const filteredColumns = React.useMemo(() => {
    if (!searchQuery.trim()) return columns

    const query = searchQuery.toLowerCase()
    return columns.map(col => ({
      ...col,
      jobApplications: col.jobApplications.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.name.toLowerCase().includes(query) ||
        (job.location && job.location.toLowerCase().includes(query)) ||
        (job.source && job.source.toLowerCase().includes(query))
      )
    }))
  }, [columns, searchQuery])

  // Statistiques calculées dynamiquement sur la base des vraies données
  const stats = React.useMemo(() => {
    const allJobs = columns.flatMap(col => col.jobApplications)
    const totalJobs = allJobs.length
    
    // Entretiens actifs
    const interviewCol = columns.find(col => col.name.toLowerCase().includes('entretien'))
    const interviewCount = interviewCol ? interviewCol.jobApplications.length : 0

    // Taux de réponse (tous sauf "À postuler")
    const toApplyCol = columns.find(col => col.name.toLowerCase().includes('à postuler'))
    const toApplyCount = toApplyCol ? toApplyCol.jobApplications.length : 0
    const appliedOrMoreCount = totalJobs - toApplyCount
    const respondedCount = allJobs.filter(job => {
      const colName = columns.find(c => c.id === job.columnId)?.name.toLowerCase() || ''
      return colName.includes('entretien') || colName.includes('offre') || colName.includes('refusé')
    }).length
    
    const responseRate = appliedOrMoreCount > 0 
      ? Math.round((respondedCount / appliedOrMoreCount) * 100) 
      : 0

    return [
      { title: "Total Candidatures", value: totalJobs.toString(), icon: Briefcase, color: "text-primary" },
      { title: "Entretiens Planifiés", value: interviewCount.toString(), icon: Calendar, color: "text-amber-500", highlight: interviewCount > 0 },
      { title: "Taux de Réponse", value: `${responseRate}%`, icon: TrendingUp, color: "text-emerald-500" },
      { title: "Temps de réponse moyen", value: "N/A", icon: Clock, color: "text-primary" } // Sera alimenté plus tard
    ]
  }, [columns])

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      
      {/* Barre du haut */}
      <header className="h-[70px] border-b border-border-color flex items-center justify-between px-10">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm w-[320px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            placeholder="Rechercher une offre, entreprise, tag..." 
          />
        </div>

        <div>
          <button 
            onClick={() => alert("Ajouter une candidature manuelle en cours d'implémentation...")}
            className="bg-primary hover:bg-primary-hover text-white py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle offre
          </button>
        </div>
      </header>

      {/* Ligne des KPIs */}
      <section className="flex gap-5 px-10 pt-6 pb-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="flex-1 bg-card-bg border border-border-color rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-foreground/3 border border-border-color`}>
                <Icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">{stat.title}</p>
                <h3 className={`font-display text-2xl font-bold ${stat.highlight ? 'text-amber-500' : ''}`}>{stat.value}</h3>
              </div>
            </div>
          )
        })}
      </section>

      {/* Zone de Tableau Kanban */}
      <div className="flex-1 flex gap-5 px-10 pb-10 pt-4 overflow-x-auto items-stretch">
        {filteredColumns.map((col) => (
          <div key={col.id} className="w-[320px] min-w-[320px] bg-foreground/3 border border-border-color rounded-[20px] flex flex-col p-4">
            
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="flex items-center gap-2.5 font-semibold text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color || 'bg-col-to-apply'}`} />
                {col.name}
              </span>
              <span className="bg-foreground/5 border border-border-color px-2.5 py-0.5 rounded-full text-[11px] text-text-muted">
                {col.jobApplications.length}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {col.jobApplications.length === 0 ? (
                <div className="flex-1 border border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-6 text-center opacity-40">
                  <Briefcase size={24} className="mb-2" />
                  <p className="text-xs">Aucune offre</p>
                </div>
              ) : (
                col.jobApplications.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-card-bg border border-border-color rounded-2xl p-4 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 relative group hover:shadow-xl hover:shadow-black/20"
                  >
                    
                    <div className="flex items-start justify-between mb-3">
                      <Link 
                        href={`/company/${job.company.name.toLowerCase()}`}
                        className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors duration-150 group/link"
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] bg-black text-white">
                          {job.company.name.charAt(0)}
                        </div>
                        <span className="text-[11px] font-semibold group-hover/link:underline">{job.company.name}</span>
                      </Link>
                      
                      {job.salary && (
                        <span className="text-[10px] py-0.5 px-2 rounded-md font-medium border bg-emerald-500/8 border-emerald-500/15 text-emerald-400">
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold mb-2.5 leading-snug">{job.title}</h4>

                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {job.location && (
                        <span className="text-[10px] bg-foreground/3 border border-border-color text-foreground px-2 py-0.5 rounded-full font-medium">
                          {job.location}
                        </span>
                      )}
                      {job.tags.map((tag) => (
                        <span key={tag.id} className="text-[10px] bg-foreground/3 border border-border-color text-foreground px-2 py-0.5 rounded-full font-medium">
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-border-color pt-2.5 flex items-center justify-between text-[10px] text-text-muted">
                      <div className="flex items-center gap-1">
                        <LinkIcon size={12} />
                        {job.source || 'Manuel'}
                      </div>
                      <span>{new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        ))}
      </div>

    </main>
  )
}
