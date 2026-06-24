import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CompanyService } from '@/services/companies'
import { ArrowLeft, Building2, Briefcase, Users, Globe, ExternalLink, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/')
  const userId = session.user.id

  // Charge les données de l'entreprise depuis la base PostgreSQL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = await CompanyService.getById(id, userId) as any

  if (!company) {
    return (
      <main className="flex-1 p-10 flex flex-col justify-center items-center text-center">
        <Building2 size={48} className="text-text-muted mb-4 opacity-50" />
        <h2 className="font-display font-bold text-2xl mb-2">Entreprise introuvable</h2>
        <p className="text-text-muted text-sm max-w-[320px] mb-6">
          Cette entreprise n&apos;existe pas ou n&apos;est pas dans votre espace.
        </p>
        <Link
          href="/company"
          className="flex items-center gap-2 text-primary hover:text-primary-hover text-sm font-semibold border border-primary/20 bg-primary/5 hover:bg-primary/10 py-2.5 px-5 rounded-xl transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Fil d'ariane */}
        <div className="flex items-center gap-2 mb-8 text-xs text-text-muted">
          <Link href="/company" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            Entreprises
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{company.name}</span>
        </div>

        {/* Header entreprise */}
        <div className="bg-card-bg border border-border-color rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-sm">
              {company.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-2xl tracking-tight">{company.name}</h1>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover mt-1 transition-colors"
                >
                  <Globe size={12} />
                  {company.website.replace(/^https?:\/\//, '')}
                  <ExternalLink size={10} />
                </a>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Briefcase size={12} />
                  <span>{company.jobApplications?.length ?? 0} candidature{(company.jobApplications?.length ?? 0) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users size={12} />
                  <span>{company.contacts?.length ?? 0} contact{(company.contacts?.length ?? 0) > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidatures */}
          <div className="lg:col-span-2">
            <section className="bg-card-bg border border-border-color rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={15} className="text-primary" />
                <h2 className="font-semibold text-sm">Candidatures</h2>
              </div>
              {company.jobApplications?.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-6">Aucune candidature</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {company.jobApplications?.map((job: { id: string; title: string; column?: { name: string; color?: string } | null }) => (
                    <div key={job.id} className="flex items-center gap-3 bg-foreground/3 rounded-xl px-4 py-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: job.column?.color ?? '#6b7280' }}
                      />
                      <span className="text-sm font-medium truncate flex-1">{job.title}</span>
                      {job.column && (
                        <span className="text-xs text-text-muted flex-shrink-0">{job.column.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Contacts */}
          <div>
            <section className="bg-card-bg border border-border-color rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-primary" />
                <h2 className="font-semibold text-sm">Contacts</h2>
              </div>
              {company.contacts?.length === 0 ? (
                <p className="text-text-muted text-xs text-center py-4">Aucun contact</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {company.contacts?.map((contact: { id: string; name: string; role?: string | null; email?: string | null; phone?: string | null }) => (
                    <div key={contact.id} className="bg-foreground/3 rounded-xl p-3">
                      <p className="text-sm font-medium">{contact.name}</p>
                      {contact.role && <p className="text-xs text-text-muted">{contact.role}</p>}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-primary mt-1 hover:text-primary-hover transition-colors">
                          <Mail size={10} />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-text-muted mt-0.5 hover:text-foreground transition-colors">
                          <Phone size={10} />
                          {contact.phone}
                        </a>
                      )}
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
