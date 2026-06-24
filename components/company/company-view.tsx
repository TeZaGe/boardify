'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Briefcase, Users, Search, Plus, Globe, ChevronRight, Trash2
} from 'lucide-react'
import Link from 'next/link'

interface CompanyJob {
  id: string
  title: string
  column: { name: string; color: string } | null
}

interface Company {
  id: string
  name: string
  website: string | null
  logoUrl: string | null
  _count: { jobApplications: number; contacts: number }
  jobApplications: CompanyJob[]
}

interface CompanyViewProps {
  initialCompanies: Company[]
}

export function CompanyView({ initialCompanies }: CompanyViewProps) {
  const router = useRouter()
  const [companies, setCompanies] = useState(initialCompanies)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setCompanies(initialCompanies)
  }, [initialCompanies])

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'entreprise "${name}" ? Attention, cela supprimera également toutes les candidatures et contacts rattachés.`)) {
      return
    }

    try {
      const res = await fetch(`/api/company/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.id !== id))
        router.refresh()
      } else {
        alert("Erreur lors de la suppression de l'entreprise.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression.")
    }
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), website: formWebsite.trim() || null }),
      })
      if (res.ok) {
        router.refresh()
        setShowModal(false)
        setFormName('')
        setFormWebsite('')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const getCompanyColor = (name: string) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-amber-600',
      'from-pink-500 to-rose-600',
    ]
    return colors[name.charCodeAt(0) % colors.length]
  }

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">CRM</span>
            </div>
            <h1 className="font-display font-bold text-3xl tracking-tight">Entreprises</h1>
            <p className="text-text-muted text-sm mt-1">
              {companies.length} entreprise{companies.length > 1 ? 's' : ''} suivie{companies.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        <div className="relative mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card-bg border border-border-color rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto mb-4 text-text-muted/20" />
            <p className="text-text-muted text-sm">
              {search ? 'Aucune entreprise trouvée.' : "Les entreprises s'ajoutent automatiquement lors de la création de candidatures."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(company => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="group block bg-card-bg border border-border-color rounded-2xl p-5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getCompanyColor(company.name)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
                      {company.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
                      {company.website ? (
                        <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5 truncate">
                          <Globe size={10} />
                          {company.website.replace(/^https?:\/\//, '')}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted/40 mt-0.5 block">Pas de site web</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteCompany(company.id, company.name)
                    }}
                    className="text-text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-foreground/5 transition-colors cursor-pointer flex-shrink-0"
                    title="Supprimer l'entreprise"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Briefcase size={12} />
                    <span>{company._count.jobApplications} offre{company._count.jobApplications > 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-border-color">·</span>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Users size={12} />
                    <span>{company._count.contacts} contact{company._count.contacts > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {company.jobApplications.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {company.jobApplications.slice(0, 2).map(job => (
                      <div key={job.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: job.column?.color ?? '#6b7280' }} />
                        <span className="text-xs text-text-muted truncate">{job.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs font-semibold text-primary/0 group-hover:text-primary transition-all duration-200">
                  <span>Voir les détails</span>
                  <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-card-bg border border-border-color rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl mb-5">🏢 Ajouter une entreprise</h2>
            <div className="mb-4">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Nom <span className="text-red-400">*</span>
              </label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Google, Vercel..." autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Site web <span className="text-text-muted/50">(optionnel)</span>
              </label>
              <input type="url" value={formWebsite} onChange={e => setFormWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border-color text-sm font-medium text-text-muted hover:bg-foreground/5 transition-all">Annuler</button>
              <button onClick={handleCreate} disabled={!formName.trim() || isCreating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-primary/25">
                {isCreating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
