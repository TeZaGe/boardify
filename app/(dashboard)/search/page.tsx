'use client'

import * as React from 'react'
import { Sidebar } from '@/components/shared/sidebar'
import { Search, MapPin, Briefcase, Plus, Check, Loader2 } from 'lucide-react'
import { SearchJobResult } from '@/services/search'

export default function SearchPage() {
  const [keyword, setKeyword] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchJobResult[]>([])
  const [addedJobs, setAddedJobs] = React.useState<Record<string, boolean>>({})
  const [addingId, setAddingId] = React.useState<string | null>(null)

  // Chargement initial des offres recommandées
  React.useEffect(() => {
    handleSearch()
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (keyword) query.append('q', keyword)
      if (location) query.append('l', location)

      const response = await fetch(`/api/search?${query.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (e) {
      console.error('Error fetching job listings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddJob = async (job: SearchJobResult) => {
    setAddingId(job.id)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: job.title,
          companyName: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          salary: job.salary,
          source: job.source,
        }),
      })

      if (response.ok) {
        setAddedJobs((prev) => ({ ...prev, [job.id]: true }))
      } else {
        alert('Erreur lors de l\'ajout de la candidature.')
      }
    } catch (e) {
      console.error('Error saving job:', e)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Title */}
        <header className="h-[70px] border-b border-border-color flex items-center px-10">
          <h1 className="font-display font-bold text-xl tracking-tight">Recherche d'Emplois Intégrée</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          
          {/* Formulaire de recherche */}
          <form onSubmit={handleSearch} className="flex gap-4 bg-card-bg border border-border-color p-4 rounded-2xl mb-8">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                placeholder="Poste, technologies, mots-clés..." 
              />
            </div>
            
            <div className="w-[240px] relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-foreground/4 border border-border-color py-2.5 pl-11 pr-4 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                placeholder="Ville ou 'Télétravail'..." 
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white py-2.5 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Rechercher
            </button>
          </form>

          {/* Liste des résultats */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-card-bg border border-border-color rounded-2xl p-6 h-[200px] animate-pulse">
                  <div className="h-4 bg-foreground/5 rounded w-1/3 mb-4" />
                  <div className="h-6 bg-foreground/5 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-foreground/5 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-foreground/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="h-[300px] border border-dashed border-border-color rounded-2xl flex flex-col items-center justify-center p-10 text-center opacity-60">
              <Briefcase size={48} className="text-text-muted mb-4" />
              <h3 className="font-semibold text-lg mb-1">Aucune offre trouvée</h3>
              <p className="text-sm text-text-muted">
                Essayez d'élargir votre recherche avec d'autres mots-clés ou localisations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {results.map((job) => {
                const isAdded = addedJobs[job.id]
                const isAdding = addingId === job.id

                return (
                  <div 
                    key={job.id}
                    className="bg-card-bg border border-border-color rounded-2xl p-6 flex flex-col justify-between hover:border-primary/20 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs text-text-muted font-semibold bg-foreground/5 border border-border-color px-2.5 py-0.5 rounded-md">
                            {job.source}
                          </span>
                          <h3 className="font-display font-bold text-lg mt-2 leading-snug">{job.title}</h3>
                          <span className="text-sm font-medium text-text-muted">{job.company}</span>
                        </div>

                        {isAdded ? (
                          <div className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                            <Check size={14} />
                            Ajouté !
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddJob(job)}
                            disabled={isAdding}
                            className="bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-purple-400 hover:text-white py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50"
                          >
                            {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Ajouter au CRM
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-4">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-color pt-4 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {job.location}
                      </div>
                      {job.salary && (
                        <span className="font-semibold text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 py-0.5 px-2 rounded-md">
                          {job.salary}
                        </span>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
