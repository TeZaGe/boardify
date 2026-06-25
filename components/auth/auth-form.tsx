'use client'

import { useState } from 'react'
import { handleCredentialsSignIn, handleCredentialsSignUp, handleGoogleSignIn } from '@/app/actions/auth'
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    if (mode === 'register') {
      formData.append('name', name)
    }

    try {
      const action = mode === 'login' ? handleCredentialsSignIn : handleCredentialsSignUp
      const result = await action(null, formData)
      
      if (result && result.error) {
        setError(result.error)
        setLoading(false)
      }
      // Si réussite, next-auth redirige automatiquement vers /dashboard (géré côté serveur)
    } catch (err: any) {
      if (err.message !== 'NEXT_REDIRECT' && !err.digest?.startsWith('NEXT_REDIRECT')) {
        setError('Une erreur inattendue est survenue.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex border-b border-border-color">
        <button
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            mode === 'login'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-foreground'
          }`}
        >
          Se connecter
        </button>
        <button
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            mode === 'register'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-foreground'
          }`}
        >
          Créer un compte
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Nom complet
            </label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Adresse email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              placeholder="votre@adresse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-foreground/3 border border-border-color rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {mode === 'login' ? 'Connexion...' : 'Création du compte...'}
            </>
          ) : (
            mode === 'login' ? 'Se connecter' : 'Créer un compte'
          )}
        </button>
      </form>

      {/* Separator */}
      <div className="flex items-center text-text-muted/30 text-xs font-semibold uppercase tracking-wider before:content-[''] before:flex-1 before:h-[1px] before:bg-border-color before:mr-4 after:content-[''] after:flex-1 after:h-[1px] after:bg-border-color after:ml-4">
        Ou
      </div>

      {/* Google Sign-in */}
      <button
        onClick={() => handleGoogleSignIn()}
        className="w-full bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 active:translate-y-0 cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.12h4.01c2.34-2.16 3.69-5.32 3.69-8.74z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.12c-1.12.75-2.54 1.19-3.95 1.19-3.05 0-5.63-2.06-6.55-4.83H1.31v3.22A12 12 0 0 0 12 24z"/>
          <path fill="#FBBC05" d="M5.45 14.33a7.14 7.14 0 0 1 0-4.66V6.45H1.31a12 12 0 0 0 0 11.1l4.14-3.22z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.31 6.45l4.14 3.22c.92-2.77 3.5-4.83 6.55-4.83z"/>
        </svg>
        Continuer avec Google
      </button>
    </div>
  )
}
