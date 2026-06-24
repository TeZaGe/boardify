'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp, Briefcase, Calendar, XCircle, MapPin,
  FileText, Award, Loader2, Sparkles, AlertCircle, FileQuestion
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid
} from 'recharts'

interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: any
  color: string
}

function StatCard({ title, value, subtext, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">{title}</span>
        <span className="text-3xl font-display font-bold tracking-tight text-text-main block">{value}</span>
        {subtext && <span className="text-xs text-text-muted/80 font-medium block">{subtext}</span>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10 flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
    </div>
  )
}

interface AnalyticsData {
  total: number
  applied: number
  interviews: number
  offers: number
  refusals: number
  responseRate: number
  byStatus: { name: string; value: number; color: string }[]
  byLocation: { location: string; count: number }[]
  byCv: { name: string; total: number; interviews: number; refusals: number; offers: number; successRate: number }[]
  byMonth: { month: string; applications: number; interviews: number }[]
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function fetchStats() {
      try {
        const res = await fetch('/api/analytics')
        if (!res.ok) throw new Error('Erreur lors du chargement des statistiques')
        const json = await res.json()
        if (json.success) {
          setData(json.stats)
        } else {
          throw new Error(json.error?.message || 'Une erreur est survenue')
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de se connecter au serveur.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-text-muted font-medium text-sm animate-pulse">Chargement de votre tableau de bord...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="text-red-400" size={32} />
        </div>
        <h2 className="font-display font-bold text-xl mb-2 text-text-main">Erreur de chargement</h2>
        <p className="text-text-muted text-sm mb-6">{error || 'Statistiques indisponibles.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Trouve le meilleur CV basé sur le taux de réussite (successRate)
  const bestCv = data.byCv.length > 0 ? data.byCv[0] : null

  // Filtre les statuts vides de la distribution pour le PieChart
  const statusChartData = data.byStatus.filter(s => s.value > 0)

  return (
    <main className="flex-1 overflow-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp size={18} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-display">Statistiques</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-text-main">Mon Dashboard Analytique</h1>
          <p className="text-text-muted text-sm mt-0.5">Suivez vos performances de candidature et optimisez votre stratégie de recherche d'emploi</p>
        </div>

        {bestCv && bestCv.successRate > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Meilleure performance (A/B Test)</span>
              <p className="text-xs font-bold text-text-main truncate max-w-[200px] mt-0.5">{bestCv.name}</p>
              <span className="text-xs font-medium text-emerald-400">{bestCv.successRate}% de taux d'entretien</span>
            </div>
          </div>
        )}
      </div>

      {/* Cartes Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Candidatures"
          value={data.total}
          subtext="Offres d'emploi suivies"
          icon={Briefcase}
          color="text-primary"
        />
        <StatCard
          title="Taux de Réponse"
          value={`${data.responseRate}%`}
          subtext="Entretiens / Refus / Offres reçus"
          icon={TrendingUp}
          color="text-emerald-500"
        />
        <StatCard
          title="Entretiens"
          value={data.interviews}
          subtext="Rencontres planifiées"
          icon={Calendar}
          color="text-amber-500"
        />
        <StatCard
          title="Refus"
          value={data.refusals}
          subtext="Candidatures écartées"
          icon={XCircle}
          color="text-red-500"
        />
      </div>

      {/* Section 1: Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique d'activité */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <h3 className="font-display font-bold text-base text-text-main">Activité des Candidatures</h3>
            <p className="text-text-muted text-xs">Volume de candidatures et entretiens des 6 derniers mois</p>
          </div>
          <div className="h-[280px] w-full mt-auto">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.byMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorInts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-side)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '12px'
                    }} 
                  />
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <Area type="monotone" dataKey="applications" name="Candidatures" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
                  <Area type="monotone" dataKey="interviews" name="Entretiens" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorInts)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">Chargement...</div>
            )}
          </div>
        </div>

        {/* Donut Chart de distribution */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card flex flex-col">
          <div className="mb-2">
            <h3 className="font-display font-bold text-base text-text-main">Distribution des Candidatures</h3>
            <p className="text-text-muted text-xs">Proportion des candidatures par étape</p>
          </div>
          
          {statusChartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <FileQuestion className="text-text-muted/40 mb-2" size={32} />
              <p className="text-xs text-text-muted">Aucune candidature active pour générer le diagramme.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between mt-auto">
              <div className="h-[200px] w-full relative flex items-center justify-center">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-side)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '12px',
                          color: 'var(--text-main)',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-text-muted text-xs">Chargement...</div>
                )}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-display text-text-main">{data.total}</span>
                  <span className="text-[10px] text-text-muted uppercase font-semibold">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusChartData.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-1 py-0.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-text-main truncate">{s.name} : <strong className="font-semibold">{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: CV A/B Testing & Top Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV A/B Testing Panel */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card lg:col-span-2 flex flex-col">
          <div className="mb-5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <h3 className="font-display font-bold text-base text-text-main">Performance des CVs (A/B Testing)</h3>
            </div>
            <p className="text-text-muted text-xs mt-0.5">Comparez les performances de vos différents CV pour maximiser vos entretiens</p>
          </div>

          {data.byCv.length === 0 ? (
            <div className="flex-1 border border-dashed border-border-color rounded-xl flex flex-col items-center justify-center p-8 text-center bg-foreground/2">
              <FileText className="text-text-muted/40 mb-3" size={32} />
              <h4 className="font-semibold text-sm mb-1">Aucune donnée d'A/B Testing</h4>
              <p className="text-xs text-text-muted max-w-sm">Associez vos CVs à vos candidatures dans vos tableaux (onglet "Documents") pour comparer leur efficacité.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-color">
                      <th className="pb-3 text-xs font-bold text-text-muted uppercase font-display">Nom du CV</th>
                      <th className="pb-3 text-xs font-bold text-text-muted uppercase text-center font-display">Applications</th>
                      <th className="pb-3 text-xs font-bold text-text-muted uppercase text-center font-display">Entretiens</th>
                      <th className="pb-3 text-xs font-bold text-text-muted uppercase text-center font-display">Refus / Offres</th>
                      <th className="pb-3 text-xs font-bold text-text-muted uppercase text-right font-display">Taux d'Entretien</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/50">
                    {data.byCv.map((cv, idx) => (
                      <tr key={idx} className="group hover:bg-foreground/2 transition-colors">
                        <td className="py-3.5 pr-4 flex items-center gap-2 min-w-[200px]">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                            <FileText size={15} />
                          </div>
                          <span className="text-xs font-semibold text-text-main truncate max-w-[180px] md:max-w-[260px]" title={cv.name}>{cv.name}</span>
                        </td>
                        <td className="py-3.5 text-xs text-text-muted text-center font-medium">{cv.total}</td>
                        <td className="py-3.5 text-xs text-amber-400 text-center font-bold">{cv.interviews}</td>
                        <td className="py-3.5 text-xs text-text-muted text-center font-medium">
                          {cv.refusals} <span className="text-[10px] opacity-40">/</span> <span className="text-emerald-400 font-bold">{cv.offers}</span>
                        </td>
                        <td className="py-3.5 text-right min-w-[120px]">
                          <div className="flex items-center justify-end gap-2.5">
                            <span className={`text-xs font-bold ${cv.successRate >= 30 ? 'text-emerald-400' : cv.successRate > 0 ? 'text-amber-400' : 'text-text-muted'}`}>
                              {cv.successRate}%
                            </span>
                            <div className="w-16 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cv.successRate >= 30 ? 'bg-emerald-500' : 'bg-primary'}`}
                                style={{ width: `${cv.successRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Zones Géographiques */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 shadow-card flex flex-col">
          <div className="mb-5">
            <h3 className="font-display font-bold text-base text-text-main">Zones Géographiques</h3>
            <p className="text-text-muted text-xs">Villes et bassins d'emploi les plus ciblés</p>
          </div>

          {data.byLocation.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <MapPin className="text-text-muted/30 mb-2" size={32} />
              <p className="text-xs text-text-muted">Aucune localisation renseignée dans vos offres.</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3.5">
              {data.byLocation.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-foreground/4 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors flex-shrink-0">
                      <MapPin size={13} />
                    </div>
                    <span className="text-xs font-semibold text-text-main truncate">{loc.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-foreground/5 px-2 py-0.5 rounded-full text-text-muted font-bold">{loc.count} offre{loc.count > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
