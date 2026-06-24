'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  User, Key, Copy, Check, RefreshCw,
  Puzzle, Shield, Sun, Moon, Loader2
} from 'lucide-react'
import Image from 'next/image'

interface SettingsViewProps {
  user: {
    name: string | null
    email: string | null
    image: string | null
    extensionToken: string | null
  }
}

export function SettingsView({ user }: SettingsViewProps) {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [currentToken, setCurrentToken] = useState(user.extensionToken)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenConfirm, setRegenConfirm] = useState(false)

  const userInitials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U'

  const copyToken = async () => {
    if (!currentToken) return
    await navigator.clipboard.writeText(currentToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!regenConfirm) {
      setRegenConfirm(true)
      setTimeout(() => setRegenConfirm(false), 4000)
      return
    }
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/auth/token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { token: string }
        setCurrentToken(data.token)
        setTokenVisible(true)
        setRegenConfirm(false)
      }
    } finally {
      setIsRegenerating(false)
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
          <p className="text-text-muted text-sm mt-1">Gérez votre compte et vos préférences</p>
        </div>

        <div className="space-y-5">
          {/* Profil */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Profil</h2>
            </div>
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? 'Avatar'} width={56} height={56}
                  className="rounded-2xl border border-border-color flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center font-bold text-white text-xl border border-foreground/10 flex-shrink-0">
                  {userInitials}
                </div>
              )}
              <div>
                <p className="font-semibold text-base">{user.name ?? 'Utilisateur'}</p>
                <p className="text-text-muted text-sm">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-text-muted">Connecté via Google</span>
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
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border-color px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                {theme === 'dark' ? <><Sun size={15} /> Mode clair</> : <><Moon size={15} /> Mode sombre</>}
              </button>
            </div>
          </section>

          {/* Token extension */}
          <section className="bg-card-bg border border-border-color rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Puzzle size={15} className="text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Extension de navigateur</h2>
            </div>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Utilisez ce jeton pour configurer l&apos;extension Jobby dans Chrome ou Firefox.
            </p>

            {currentToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border-color rounded-xl px-4 py-2.5 font-mono text-xs text-foreground overflow-hidden">
                    {tokenVisible ? currentToken : currentToken.slice(0, 8) + '••••••••••••••••••••••••••••••'}
                  </div>
                  <button onClick={() => setTokenVisible(!tokenVisible)}
                    className="px-3 py-2.5 rounded-xl border border-border-color text-xs text-text-muted hover:text-foreground hover:bg-foreground/5 transition-all whitespace-nowrap">
                    {tokenVisible ? 'Masquer' : 'Voir'}
                  </button>
                  <button onClick={copyToken}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      copied ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15'
                    }`}>
                    {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier</>}
                  </button>
                </div>

                <button onClick={handleRegenerate} disabled={isRegenerating}
                  className={`flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl border transition-all ${
                    regenConfirm
                      ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15'
                      : 'border-border-color text-text-muted hover:text-foreground hover:bg-foreground/5'
                  }`}>
                  {isRegenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  {regenConfirm ? 'Confirmer (ancien token invalidé)' : 'Régénérer le token'}
                </button>

                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <Shield size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80">Gardez ce jeton secret. Il donne accès à votre compte.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted">
                <Key size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun jeton généré</p>
                <p className="text-xs mt-1">Reconnectez-vous pour en générer un automatiquement</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
