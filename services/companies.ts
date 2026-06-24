import { db } from '@/lib/db'

/**
 * Service gérant la logique métier des entreprises partenaires/suivies.
 */
export class CompanyService {
  /**
   * Récupère toutes les entreprises d'un utilisateur avec le décompte de leurs candidatures activement suivies
   */
  static async getAllByUserId(userId: string) {
    return db.company.findMany({
      where: { userId },
      include: {
        jobApplications: {
          where: { deletedAt: null },
          include: {
            column: true,
            history: {
              include: { toColumn: true }
            }
          }
        },
        _count: {
          select: {
            jobApplications: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  }

  static async getById(idOrName: string, userId: string) {
    return db.company.findFirst({
      where: {
        userId,
        OR: [
          { id: idOrName },
          { name: { equals: idOrName, mode: 'insensitive' } }
        ]
      },
      include: {
        jobApplications: {
          where: { deletedAt: null },
          include: { 
            column: true,
            history: {
              include: { toColumn: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        contacts: true
      }
    })
  }

  /**
   * Calcule le temps de réponse moyen en jours à partir des candidatures
   */
  static calculateAverageResponseTime(jobs: any[]) {
    let totalDays = 0
    let count = 0

    for (const job of jobs) {
      if (!job.appliedAt) continue

      // Cherche la première transition vers Entretien, Offres reçues, ou Refusé / Clôturé
      const responseHistories = job.history?.filter((h: any) => {
        const name = h.toColumn?.name?.toLowerCase() || ''
        return name.includes('entretien') || name.includes('offre') || name.includes('refus') || name.includes('clôturé')
      }) || []

      let responseDate: Date | null = null

      if (responseHistories.length > 0) {
        // Prend la transition la plus ancienne vers une étape de réponse
        const oldest = responseHistories.reduce((min: any, current: any) => 
          new Date(current.changedAt) < new Date(min.changedAt) ? current : min
        , responseHistories[0])
        responseDate = new Date(oldest.changedAt)
      } else {
        // Si pas d'historique, mais qu'on est déjà dans une de ces colonnes
        const colName = job.column?.name?.toLowerCase() || ''
        if (colName.includes('entretien') || colName.includes('offre') || colName.includes('refus') || colName.includes('clôturé')) {
          responseDate = new Date(job.updatedAt)
        }
      }

      if (responseDate) {
        const diffTime = responseDate.getTime() - new Date(job.appliedAt).getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays >= 0) {
          totalDays += diffDays
          count++
        }
      }
    }

    if (count === 0) return null
    const avg = Math.round(totalDays / count)
    return `${avg} jour${avg > 1 ? 's' : ''}`
  }
}
