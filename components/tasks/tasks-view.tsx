'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ClipboardList, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  Plus,
  Trash2,
  Phone,
  Mail,
  Users,
  Loader2,
  X
} from 'lucide-react'
import Link from 'next/link'

interface TasksViewProps {
  initialJobs: any[]
  initialEvents: any[]
  defaultBoardId?: string
}

export function TasksView({ initialJobs, initialEvents, defaultBoardId = '' }: TasksViewProps) {
  const router = useRouter()
  const [events, setEvents] = React.useState(initialEvents)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  // Form states
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newType, setNewType] = React.useState('TASK')
  const [newDateStr, setNewDateStr] = React.useState('')
  const [newTimeStr, setNewTimeStr] = React.useState('09:00')
  const [newJobId, setNewJobId] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Calcule les relances automatiques (7 jours après la date d'envoi dans la colonne "Postulé")
  const followUpReminders = React.useMemo(() => {
    const today = new Date()
    return initialJobs.filter(job => {
      if (!job.appliedAt) return false
      
      const colName = job.column?.name?.toLowerCase() || ''
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
            return { ...evt, completed: !currentCompleted, updatedAt: new Date().toISOString() }
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

  // Gère la suppression d'une tâche
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous supprimer cette tâche ?")) return
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setEvents(prev => prev.filter(evt => evt.id !== eventId))
        router.refresh()
      } else {
        alert("Erreur lors de la suppression.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Création d'une tâche
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDateStr) return

    setIsSubmitting(true)
    const combinedDate = new Date(`${newDateStr}T${newTimeStr}:00`)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          date: combinedDate.toISOString(),
          jobApplicationId: newJobId || null
        })
      })

      if (res.ok) {
        const json = await res.json()
        setEvents(prev => [...prev, json.event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        setNewTitle('')
        setNewJobId('')
        setShowAddForm(false)
        router.refresh()
      } else {
        alert("Erreur lors de la création de la tâche.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Génération de la grille du calendrier
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const startOfWeekDay = (firstDay.getDay() + 6) % 7 // Lundi = 0

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate()

    const days = []

    // Padding mois précédent
    for (let i = startOfWeekDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, totalDaysInPrevMonth - i),
        isCurrentMonth: false
      })
    }

    // Mois en cours
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Padding mois suivant (pour faire 6 lignes de 7 jours = 42)
    const totalSlots = 42
    const nextPadding = totalSlots - days.length
    for (let i = 1; i <= nextPadding; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return days
  }, [currentMonth])

  // Change de mois
  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  // Vérifie si une date a des tâches actives
  const dateHasTasks = (date: Date) => {
    return events.some(evt => {
      if (evt.completed) return false
      const evtDate = new Date(evt.date)
      return evtDate.getDate() === date.getDate() &&
             evtDate.getMonth() === date.getMonth() &&
             evtDate.getFullYear() === date.getFullYear()
    })
  }

  // Sélectionne un jour du calendrier
  const handleDateClick = (date: Date) => {
    setSelectedDate(prev => {
      if (prev && prev.getTime() === date.getTime()) {
        return null // Déselectionner
      }
      return date
    })
    
    // Remplir la date automatiquement dans le formulaire
    const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setNewDateStr(localDate)
  }

  // Filtrer les événements selon la date sélectionnée
  const activeEvents = React.useMemo(() => {
    return events.filter(evt => {
      if (evt.completed) return false
      if (!selectedDate) return true
      const evtDate = new Date(evt.date)
      return evtDate.getDate() === selectedDate.getDate() &&
             evtDate.getMonth() === selectedDate.getMonth() &&
             evtDate.getFullYear() === selectedDate.getFullYear()
    })
  }, [events, selectedDate])

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
      case 'INTERVIEW': return '📞 Entretien'
      case 'FOLLOW_UP': return '📧 Relance'
      case 'TASK': return '📋 Action/Tâche'
      case 'MEETING': return '👥 RDV / Réunion'
      default: return 'Autre'
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-8 text-left max-w-7xl mx-auto w-full">
      {/* En-tête */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">Agenda & Actions</h1>
            <p className="text-text-muted text-xs mt-0.5">Planifiez vos relances et gérez vos tâches de recherche d&apos;emploi</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!newDateStr) {
              const today = new Date()
              setNewDateStr(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
            }
            setShowAddForm(true)
          }}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:-translate-y-0.5"
        >
          <Plus size={15} />
          Planifier une action
        </button>
      </header>

      {/* Grid principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Colonne Gauche : Calendrier & Formulaire */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendrier */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-text-main font-display">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-color text-text-muted hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => changeMonth(1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-color text-text-muted hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const active = selectedDate && selectedDate.getTime() === day.date.getTime()
                const today = isToday(day.date)
                const hasTasks = dateHasTasks(day.date)

                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(day.date)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold cursor-pointer transition-all duration-150 ${
                      !day.isCurrentMonth ? 'text-text-muted/30 hover:bg-foreground/2' : ''
                    } ${
                      day.isCurrentMonth && !active && !today ? 'text-text-main hover:bg-foreground/5' : ''
                    } ${
                      today && !active ? 'bg-primary/10 border border-primary/20 text-primary' : ''
                    } ${
                      active ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.03]' : ''
                    }`}
                  >
                    <span>{day.date.getDate()}</span>
                    {hasTasks && (
                      <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${active ? 'bg-white' : 'bg-primary'}`} />
                    )}
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Voir toutes les dates
                </button>
              </div>
            )}
          </section>

          {/* Formulaire planificateur */}
          {showAddForm && (
            <section className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-card animate-slide-up relative">
              <button
                onClick={() => setShowAddForm(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-foreground p-1 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                <X size={15} />
              </button>
              
              <h3 className="font-display font-bold text-sm text-text-main mb-4 flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-primary" />
                Planifier une action
              </h3>

              <form onSubmit={handleCreateEvent} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Titre de l&apos;action</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Rappeler M. Martin, relancer RH..."
                    className="w-full bg-foreground/3 border border-border-color rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      required
                      value={newDateStr}
                      onChange={(e) => setNewDateStr(e.target.value)}
                      className="w-full bg-foreground/3 border border-border-color rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Heure</label>
                    <input
                      type="time"
                      required
                      value={newTimeStr}
                      onChange={(e) => setNewTimeStr(e.target.value)}
                      className="w-full bg-foreground/3 border border-border-color rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Type d&apos;action</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-foreground/3 border border-border-color rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="TASK" className="bg-bg-side text-slate-900 dark:text-slate-100">📋 Tâche générale / Action</option>
                    <option value="FOLLOW_UP" className="bg-bg-side text-slate-900 dark:text-slate-100">📧 Relance (Mail / Appel)</option>
                    <option value="INTERVIEW" className="bg-bg-side text-slate-900 dark:text-slate-100">📞 Entretien</option>
                    <option value="MEETING" className="bg-bg-side text-slate-900 dark:text-slate-100">👥 Réunion / RDV</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Lier à une candidature (Optionnel)</label>
                  <select
                    value={newJobId}
                    onChange={(e) => setNewJobId(e.target.value)}
                    className="w-full bg-foreground/3 border border-border-color rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="" className="bg-bg-side text-slate-900 dark:text-slate-100">-- Aucune liaison (Tâche générale) --</option>
                    {initialJobs.map(job => (
                      <option key={job.id} value={job.id} className="bg-bg-side text-slate-900 dark:text-slate-100">
                        {job.title} ({job.company.name})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  Planifier
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Colonne Milieu : Tâches à réaliser & Relances suggérées */}
        <div className="lg:col-span-2 space-y-6">
          {/* Relances suggérées */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-amber-500" size={18} />
              <h2 className="font-display font-bold text-base text-text-main">Relances suggérées (Pas de réponse après 7 jours)</h2>
              {followUpReminders.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto">
                  {followUpReminders.length}
                </span>
              )}
            </div>

            {followUpReminders.length === 0 ? (
              <div className="flex items-center gap-2.5 text-xs text-text-muted bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Super ! Aucune candidature en attente de relance depuis plus de 7 jours.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {followUpReminders.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-foreground/2 border border-border-color rounded-xl p-3 flex items-center justify-between gap-3 hover:border-amber-500/20 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <Clock size={10} />
                          Envoyé il y a {job.daysSinceApplied} jours
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-text-main truncate">{job.title} chez <strong className="text-foreground font-semibold">{job.company.name}</strong></h4>
                    </div>

                    <Link 
                      href={`/dashboard/${job.column?.boardId || defaultBoardId}?jobId=${job.id}`}
                      className="bg-foreground/3 hover:bg-amber-500/10 border border-border-color hover:border-amber-500/20 text-text-muted hover:text-amber-400 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all flex-shrink-0"
                    >
                      Détails
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Liste des actions planifiées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Colonne Actions Actives (k€) */}
            <section className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-card md:col-span-2">
              <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-primary" size={18} />
                  <h2 className="font-display font-bold text-base text-text-main">
                    {selectedDate 
                      ? `Actions du ${selectedDate.toLocaleDateString('fr-FR')}` 
                      : 'Toutes les actions actives'}
                  </h2>
                </div>
                {activeEvents.length > 0 && (
                  <span className="bg-primary/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {activeEvents.length}
                  </span>
                )}
              </div>

              {activeEvents.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-color rounded-xl bg-foreground/2">
                  <CalendarIcon className="text-text-muted/40 mx-auto mb-2" size={24} />
                  <p className="text-xs text-text-muted">Aucune action planifiée pour cette sélection.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {activeEvents.map((evt) => (
                    <div 
                      key={evt.id} 
                      className="bg-foreground/2 border border-border-color rounded-xl p-4 flex items-start gap-3 hover:border-primary/15 transition-all group"
                    >
                      <input 
                        type="checkbox"
                        checked={evt.completed}
                        onChange={() => handleToggleEvent(evt.id, evt.completed)}
                        className="mt-1 w-4 h-4 text-primary bg-foreground/4 border-border-color rounded focus:ring-primary/20 cursor-pointer flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold py-0.5 px-2 rounded-md border ${getEventBadgeColor(evt.type)}`}>
                            {getEventLabel(evt.type)}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium">
                            Prévu le {new Date(evt.date).toLocaleDateString('fr-FR')} à {new Date(evt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-text-main mb-0.5 leading-snug break-words">{evt.title}</h4>
                        
                        {evt.jobApplication && (
                          <Link 
                            href={`/dashboard/${evt.jobApplication.column?.boardId || defaultBoardId}?jobId=${evt.jobApplication.id}`}
                            className="text-[10px] text-purple-400 hover:underline flex items-center gap-1.5 mt-1"
                          >
                            <Briefcase size={10} />
                            <span>Candidature : <strong>{evt.jobApplication.title}</strong> chez {evt.jobApplication.company.name} ↗</span>
                          </Link>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="text-text-muted/50 hover:text-red-400 p-1 rounded-lg hover:bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0 self-start"
                        title="Supprimer la tâche"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Historique Tâches Terminées (Archivées) */}
            <section className="bg-card-bg border border-border-color rounded-2xl p-5 shadow-card md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="text-emerald-400" size={18} />
                <h2 className="font-display font-bold text-base text-text-main">Archivées</h2>
                {completedEvents.length > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto">
                    {completedEvents.length}
                  </span>
                )}
              </div>

              {completedEvents.length === 0 ? (
                <p className="text-xs text-text-muted py-6 text-center italic">Aucune tâche archivée</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {completedEvents.map((evt) => (
                    <div 
                      key={evt.id} 
                      className="bg-foreground/1 border border-border-color/60 rounded-xl p-3 flex items-start gap-2.5 opacity-60 hover:opacity-100 transition-opacity group"
                    >
                      <input 
                        type="checkbox"
                        checked={evt.completed}
                        onChange={() => handleToggleEvent(evt.id, evt.completed)}
                        className="mt-0.5 w-3.5 h-3.5 text-emerald-500 bg-foreground/4 border-border-color rounded focus:ring-emerald-500/20 cursor-pointer flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-text-main line-through truncate" title={evt.title}>{evt.title}</h4>
                        <span className="text-[9px] text-text-muted leading-none">
                          Fini le {new Date(evt.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="text-text-muted/40 hover:text-red-400 p-0.5 rounded hover:bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

      </div>

    </main>
  )
}
