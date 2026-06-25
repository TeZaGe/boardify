'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  User, Sun, Moon, Key, MapPin, DollarSign, Save, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { updateUserSettings } from '@/app/actions/settings'
import { AddressAutocomplete } from '@/components/shared/address-autocomplete'

interface SettingsViewProps {
  user: {
    name: string | null
    email: string | null
    image: string | null
    homeAddress: string | null
    minSalary: number
    maxSalary: number
  }
}

export function SettingsView({ user }: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user.name || '')
  const [homeAddress, setHomeAddress] = useState(user.homeAddress || '')
  const [minSalary, setMinSalary] = useState(user.minSalary)
  const [maxSalary, setMaxSalary] = useState(user.maxSalary)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const userInitials = name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('homeAddress', homeAddress)
    formData.append('minSalary', minSalary.toString())
    formData.append('maxSalary', maxSalary.toString())

    try {
      const result = await updateUserSettings(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Configuration</span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Paramètres</h1>
          <p className="text-text-muted text-sm mt-1">Gérez votre compte et vos préférences de recherche d&apos;emploi</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Status alerts */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Paramètres enregistrés avec succès.</span>
            </div>
          )}

          {/* Profil */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Profil</h2>
            </div>
            
            <div className="flex items-center gap-4 pb-4 border-b border-border-color/50">
              {user.image ? (
                <Image src={user.image} alt={name ?? 'Avatar'} width={56} height={56}
                  className="rounded-2xl border border-border-color flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center font-bold text-white text-xl border border-foreground/10 flex-shrink-0">
                  {userInitials}
                </div>
              )}
              <div>
                <p className="font-semibold text-base">{name || 'Utilisateur'}</p>
                <p className="text-text-muted text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </section>

          {/* Critères de Recherche */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Critères de recherche</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Adresse de domicile
              </label>
              <AddressAutocomplete
                value={homeAddress}
                onChange={setHomeAddress}
                placeholder="Ex: 10 Rue de la Paix, Paris"
                className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                <DollarSign size={13} />
                <span>Rémunération souhaitée (Intervalle en k€ brut/an)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-foreground/2 p-4 rounded-xl border border-border-color/50">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-text-muted">Minimum</span>
                    <span className="text-primary font-bold">{minSalary} k€</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={minSalary}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setMinSalary(val)
                      if (val > maxSalary) setMaxSalary(val)
                    }}
                    className="w-full h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-text-muted">Maximum</span>
                    <span className="text-primary font-bold">{maxSalary} k€</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={maxSalary}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setMaxSalary(val)
                      if (val < minSalary) setMinSalary(val)
                    }}
                    className="w-full h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Apparence */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sun size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Apparence</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Thème de l&apos;interface</p>
                <p className="text-xs text-text-muted mt-0.5">Choisissez entre le mode sombre et clair</p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border-color px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                suppressHydrationWarning
              >
                {!mounted ? (
                  <><Moon size={15} /> Mode sombre</>
                ) : theme === 'dark' ? (
                  <><Sun size={15} /> Mode clair</>
                ) : (
                  <><Moon size={15} /> Mode sombre</>
                )}
              </button>
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-hover text-white py-3 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
