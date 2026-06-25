import { Briefcase, Check, Sparkles } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage() {
  // Si l'utilisateur est déjà connecté, on le redirige
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center overflow-hidden relative px-4 py-8">
      {/* Halos de lumières d'ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-radial from-primary/12 to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-radial from-emerald-500/8 to-transparent pointer-events-none z-0" />
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}
      />

      <div className="flex w-full max-w-[1000px] min-h-[620px] bg-card-bg backdrop-blur-xl border border-border-color rounded-[24px] overflow-hidden z-10 shadow-2xl shadow-primary/5">
        
        {/* Partie gauche : Branding & Intro */}
        <div className="hidden md:flex flex-[1.2] bg-gradient-to-br from-purple-950/20 to-neutral-950/40 p-12 flex-col justify-between border-r border-border-color">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              boardify
            </span>
          </div>

          <div className="my-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={12} className="text-primary" />
              <span className="text-xs font-medium text-primary">CRM de recherche d'emploi</span>
            </div>
            <h1 className="font-display font-extrabold text-[36px] leading-[1.15] mb-6 tracking-tight">
              Prenez le contrôle de votre <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">recherche d'emploi</span>.
            </h1>
            <p className="text-text-muted text-sm leading-relaxed mb-8 max-w-[380px]">
              Centralisez vos offres, suivez vos entretiens, et analysez vos statistiques avec notre tableau Kanban dynamique.
            </p>

            <div className="flex flex-col gap-3">
              {[
                'Tableau Kanban multi-board',
                'Statistiques & analyses détaillées',
                'Import Excel intelligent',
                'Suivi des entretiens & rappels automatiques',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-foreground/3 border border-border-color px-4 py-2.5 rounded-full w-fit">
                  <Check size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-text-muted/50">
            © 2026 Boardify CRM. Tous droits réservés.
          </span>
        </div>

        {/* Partie droite : Formulaire de Connexion */}
        <div className="flex-1 p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            {/* Logo mobile */}
            <div className="flex md:hidden items-center gap-3 mb-6 justify-center">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <Briefcase size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">boardify</span>
            </div>
            <h2 className="font-display font-bold text-2xl mb-1 tracking-tight">
              Bienvenue sur Boardify
            </h2>
            <p className="text-text-muted text-sm">
              Connectez-vous ou créez un compte pour suivre vos candidatures.
            </p>
          </div>

          <AuthForm />

          <p className="text-center text-[10px] text-text-muted/40 mt-6">
            En vous connectant, vous acceptez nos{' '}
            <span className="text-text-muted/60 hover:text-primary cursor-pointer transition-colors">conditions d'utilisation</span>
          </p>
        </div>
      </div>
    </main>
  )
}
