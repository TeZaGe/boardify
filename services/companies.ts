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

  /**
   * Récupère les détails d'une entreprise avec toutes ses candidatures associées et son réseau de contacts
   */
  static async getById(id: string, userId: string) {
    return db.company.findFirst({
      where: { id, userId },
      include: {
        jobApplications: {
          where: { deletedAt: null },
          include: { column: true },
          orderBy: { createdAt: 'desc' }
        },
        contacts: true
      }
    })
  }
}
