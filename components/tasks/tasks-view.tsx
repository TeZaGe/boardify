'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

interface TasksViewProps {
  initialJobs: any[]
  initialEvents: any[]
}

export function TasksView({ initialJobs, initialEvents }: TasksViewProps) {
  const router = useRouter()
  const [events, setEvents] = React.useState(initialEvents)

  React.useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Calcule les relances automatiques (7 jours après la date d'envoi dans la colonne "Postulé")
  const followUpReminders = React.useMemo(() => {
    const today = new Date()
    return initialJobs.filter(job => {
      if (!job.appliedAt) return false
      
      const colName = job.column?.name?.toLowerCase() || ''
      // Uniquement si toujours dans la colonne "Postulé" (ou qui contient "postulé")
      if (!colName.includes('postulé')) return false

      const appliedDate = new Date(job.appliedAt)
      const diffTime = today.getTime() - appliedDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays >= 7
    }).map(job => {
      const appliedDate = new Date(job.appliedAt!)
      const diffTime = today.getTime() - appliedDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return {
        ...job,
        daysSinceApplied: diffDays
      }
    })
  }, [initialJobs])

  // Gère le changement d'état d'une tâche (terminé / à faire)
  const handleToggleEvent = async (eventId: string, currentCompleted: boolean) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      })

      if (res.ok) {
        setEvents(prev => prev.map(evt => {
          if (evt.id === eventId) {
            return { ...evt, completed: !currentCompleted }
          }
          return evt
        }))
        router.refresh()
      } else {
        alert("Erreur lors de la mise à jour de la tâche.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Sépare les événements (à faire vs terminés)
  const activeEvents = events.filter(e => !e.completed)
  const completedEvents = events.filter(e => e.completed)

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'INTERVIEW':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      case 'FOLLOW_UP':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      case 'TASK':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400'
      case 'MEETING':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      default:
        return 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'INTERVIEW': return 'Entretien'
      case 'FOLLOW_UP': return 'Relance'
      case 'TASK': return 'Tâche'
      case 'MEETING': return 'Réunion'
      default: return 'Autre'
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-10 text-left">
      
      {/* En-tête */}
      <header className="flex items-center gap-3 mb-8">
        <ClipboardList size={24} className="text-primary" />
        <h1 className="font-display font-bold text-3xl tracking-tight">Tâches & Rappels</h1>
      </header>

      {/* Grid principale */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Colonne gauche/milieu : Rappels de relance & Événements à faire */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Section 1 : Relances suggérées (Alertes automatiques 7j) */}
          <section className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="text-amber-500" size={20} />
              <h2 className="font-display font-bold text-lg">Relances suggérées (Pas de réponse après 7 jours)</h2>
              {followUpReminders.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {followUpReminders.length}
                </span>
              )}
            </div>

            {followUpReminders.length === 0 ? (
              <div className="flex items-center gap-3 text-xs text-text-muted py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Super ! Vous n'avez aucune candidature en attente de relance depuis plus de 7 jours.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {followUpReminders.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-foreground/2 border border-border-color rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/25 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          Envoyé il y a {job.daysSinceApplied} jours
                        </span>
                        <span className="text-[10px] bg-foreground/5 border border-border-color px-2 py-0.5 rounded-full text-text-muted">
                          Étape : {job.column.name}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-text-main mb-0.5">{job.title}</h4>
                      <p className="text-xs text-text-muted">chez <strong className="text-foreground">{job.company.name}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link 
                        href="/dashboard"
                        className="bg-foreground/3 hover:bg-amber-500/10 border border-border-color hover:border-amber-500/20 text-text-muted hover:text-amber-400 text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all duration-150"
                      >
                        Voir sur le tableau
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2 : Tâches & Événements à faire */}
          <section className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-primary" size={20} />
              <h2 className="font-display font-bold text-lg">Événements & Actions à réaliser</h2>
              {activeEvents.length > 0 && (
                <span className="bg-primary/20 text-purple-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {activeEvents.length}
                </span>
              )}
            </div>

            {activeEvents.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">Aucune tâche planifiée en cours.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activeEvents.map((evt) => (
                  <div 
                    key={evt.id} 
                    className="bg-foreground/2 border border-border-color rounded-xl p-4 flex items-start gap-4 hover:border-primary/20 transition-all duration-200"
                  >
                    <input 
                      type="checkbox"
                      checked={evt.completed}
                      onChange={() => handleToggleEvent(evt.id, evt.completed)}
                      className="mt-1 w-4 h-4 text-primary bg-foreground/4 border-border-color rounded focus:ring-primary/20 cursor-pointer"
                    />
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-md border ${getEventBadgeColor(evt.type)}`}>
                          {getEventLabel(evt.type)}
                        </span>
                        <span className="text-xs text-text-muted">
                          Prévu le {new Date(evt.date).toLocaleDateString('fr-FR')} à {new Date(evt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-text-main mb-0.5">{evt.title}</h4>
                      
                      {evt.jobApplication && (
                        <p className="text-xs text-text-muted flex items-center gap-1.5">
                          <Briefcase size={12} />
                          Offre : {evt.jobApplication.title} chez {evt.jobApplication.company.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Colonne droite : Historique des tâches complétées */}
        <div>
          <section className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <h2 className="font-display font-bold text-lg">Tâches terminées</h2>
              {completedEvents.length > 0 && (
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {completedEvents.length}
                </span>
              )}
            </div>

            {completedEvents.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">Aucune tâche terminée récemment.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {completedEvents.map((evt) => (
                  <div 
                    key={evt.id} 
                    className="bg-foreground/1 border border-border-color/60 rounded-xl p-4 flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity duration-150"
                  >
                    <input 
                      type="checkbox"
                      checked={evt.completed}
                      onChange={() => handleToggleEvent(evt.id, evt.completed)}
                      className="mt-1 w-4 h-4 text-emerald-500 bg-foreground/4 border-border-color rounded focus:ring-emerald-500/20 cursor-pointer"
                    />
                    
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-text-main line-through mb-1">{evt.title}</h4>
                      <p className="text-[10px] text-text-muted">
                        Terminé le {new Date(evt.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>

    </main>
  )
}
