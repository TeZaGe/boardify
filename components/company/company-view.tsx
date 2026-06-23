'use client'

import * as React from 'react'
import { 
  ArrowLeft, 
  Globe, 
  Calendar, 
  FileText, 
  Users, 
  Mail, 
  Phone 
} from 'lucide-react'
import Link from 'next/link'
import { JobApplication, Company, Column, Contact } from '@prisma/client'

// Types locaux pour le rendu
type JobWithColumn = JobApplication & {
  column: Column
}

interface CompanyViewProps {
  company: Company & {
    jobApplications: JobWithColumn[]
    contacts: Contact[]
  }
  userId: string
}

export function CompanyView({ company, userId }: CompanyViewProps) {
  const [notes, setNotes] = React.useState('')
  
  // Simulation de calculs analytiques réels sur les données de l'entreprise
  const stats = React.useMemo(() => {
    const totalOffers = company.jobApplications.length
    
    // Détermine le taux de conversion (Pourcentage d'offres débouchant sur "Entretien" ou "Offre")
    const successOffers = company.jobApplications.filter(job => {
      const colName = job.column.name.toLowerCase()
      return colName.includes('entretien') || colName.includes('offre')
    }).length

    const conversionRate = totalOffers > 0 
      ? Math.round((successOffers / totalOffers) * 100) 
      : 0

    return [
      { title: "Candidatures totales", value: totalOffers.toString(), color: "" },
      { title: "Temps de réponse moyen", value: "Calcul en cours...", color: "text-purple-400" },
      { title: "Taux de conversion", value: `${conversionRate}%`, color: "text-emerald-400" }
    ]
  }, [company])

  return (
    <main className="flex-1 overflow-y-auto p-10">
      
      <Link 
        href="/company" 
        className="flex items-center gap-2 text-text-muted hover:text-foreground text-sm font-medium mb-6 w-fit transition-colors duration-200"
      >
        <ArrowLeft size={16} />
        Retour à la liste
      </Link>

      {/* En-tête */}
      <header className="flex items-center justify-between border-b border-border-color pb-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-black border border-border-color flex items-center justify-center font-display font-extrabold text-3xl text-white shadow-xl shadow-black/30">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-1.5 tracking-tight">{company.name}</h1>
            {company.website ? (
              <a 
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1.5 w-fit"
              >
                {company.website}
                <Globe size={14} />
              </a>
            ) : (
              <span className="text-xs text-text-muted">Aucun site web</span>
            )}
          </div>
        </div>
      </header>

      {/* Grille */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonne de gauche (KPIs, Timeline, Notes) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-5">
            {stats.map((item, index) => (
              <div key={index} className="bg-card-bg border border-border-color rounded-2xl p-5 text-center">
                <p className="text-xs text-text-muted mb-1.5">{item.title}</p>
                <h3 className={`font-display text-2xl font-bold ${item.color}`}>{item.value}</h3>
              </div>
            ))}
          </div>

          {/* Historique des offres */}
          <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2.5">
              <Calendar size={18} className="text-primary" />
              Historique des offres chez {company.name}
            </h2>

            {company.jobApplications.length === 0 ? (
              <p className="text-sm text-text-muted py-2">Aucune offre associée à cette entreprise pour le moment.</p>
            ) : (
              <div className="relative pl-6 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-color">
                {company.jobApplications.map((item, i) => (
                  <div key={item.id} className="relative mb-6 last:mb-0">
                    <span className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-background bg-text-muted" />
                    
                    <div className="bg-foreground/2 border border-border-color rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1 leading-snug">{item.title}</h4>
                        <p className="text-[11px] text-text-muted">
                          Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')} • Source : {item.source || 'Manuel'}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold py-1 px-2.5 rounded-full border bg-neutral-500/10 border-neutral-500/20 text-neutral-400">
                        {item.column.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloc-notes */}
          <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2.5">
              <FileText size={18} className="text-primary" />
              Notes sur l'entreprise
            </h2>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-[150px] bg-foreground/3 border border-border-color rounded-xl p-4 text-sm leading-relaxed text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none mb-3"
              placeholder="Rédigez vos notes ici (culture, technologies utilisées, questions à poser)..."
            />
            <button 
              onClick={() => alert("Enregistrement des notes en cours...")}
              className="bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 py-2 px-4 rounded-lg text-xs font-semibold float-right cursor-pointer transition-colors duration-200"
            >
              Enregistrer les notes
            </button>
            <div className="clear-both" />
          </div>

        </div>

        {/* Colonne de droite (Contacts) */}
        <div>
          <div className="bg-card-bg border border-border-color rounded-[20px] p-6">
            <h2 className="font-display font-bold text-lg mb-6 flex items-center gap-2.5">
              <Users size={18} className="text-primary" />
              Contacts ({company.contacts.length})
            </h2>

            {company.contacts.length === 0 ? (
              <p className="text-xs text-text-muted">Aucun contact enregistré pour cette entreprise.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {company.contacts.map((contact) => (
                  <div key={contact.id} className="bg-foreground/2 border border-border-color rounded-xl p-4">
                    <h4 className="text-sm font-semibold mb-0.5">{contact.name}</h4>
                    {contact.role && <p className="text-xs text-primary font-medium mb-3">{contact.role}</p>}
                    
                    <div className="flex flex-col gap-2 text-xs text-text-muted">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors duration-150">
                          <Mail size={14} />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors duration-150">
                          <Phone size={14} />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </main>
  )
}
