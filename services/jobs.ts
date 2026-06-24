import { db } from '@/lib/db'
import { BoardService } from '@/services/boards'

/**
 * Service gérant la logique métier des candidatures (CRUD, statistiques, transitions).
 */
export class JobService {
  /**
   * Récupère une candidature par son ID avec ses relations
   */
  static async getById(id: string) {
    return db.jobApplication.findUnique({
      where: { id },
      include: {
        company: true,
        tags: true,
        notes: { orderBy: { createdAt: 'desc' } },
        events: { orderBy: { date: 'asc' } },
        documents: true
      }
    })
  }

  /**
   * Crée une nouvelle candidature (et l'entreprise associée si inexistante)
   */
  static async create(userId: string, data: {
    title: string
    companyName: string
    location?: string
    description?: string
    url?: string
    salary?: string
    source?: string
    columnId: string
    order: number
    appliedAt?: Date
  }) {
    // 1. Recherche ou crée l'entreprise associée à cet utilisateur
    let company = await db.company.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.companyName
        }
      }
    })

    if (!company) {
      company = await db.company.create({
        data: {
          name: data.companyName,
          userId
        }
      })
    }

    // 2. Crée la candidature avec la liaison entreprise
    return db.jobApplication.create({
      data: {
        title: data.title,
        location: data.location,
        description: data.description,
        url: data.url,
        salary: data.salary,
        source: data.source,
        columnId: data.columnId,
        order: data.order,
        userId,
        companyId: company.id,
        appliedAt: data.appliedAt
      },
      include: {
        company: true
      }
    })
  }

  /**
   * Récupère les colonnes et candidatures d'un tableau Kanban.
   * - Si boardId est fourni, filtre par ce tableau.
   * - Si boardId est null, utilise le tableau par défaut de l'utilisateur
   *   (le crée si nécessaire via BoardService.getOrCreateDefault).
   */
  static async getBoardData(userId: string, boardId?: string | null) {
    // Résoudre le boardId cible
    let targetBoardId: string

    if (boardId) {
      targetBoardId = boardId
    } else {
      const defaultBoard = await BoardService.getOrCreateDefault(userId)
      targetBoardId = defaultBoard.id
    }

    const columns = await db.column.findMany({
      where: { userId, boardId: targetBoardId },
      include: {
        jobApplications: {
          where: { deletedAt: null },
          include: {
            company: true,
            tags: true,
            notes: { orderBy: { createdAt: 'desc' } },
            events: { orderBy: { date: 'asc' } },
            contacts: true,
            documents: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    return columns
  }

  /**
   * Déplace une candidature vers une nouvelle colonne et enregistre l'historique
   */
  static async move(id: string, toColumnId: string, order: number) {
    const job = await db.jobApplication.findUnique({
      where: { id },
      select: { columnId: true }
    })

    if (!job) {
      throw new Error('Candidature introuvable')
    }

    const fromColumnId = job.columnId

    // Si la colonne ne change pas, on met simplement à jour l'ordre
    if (fromColumnId === toColumnId) {
      return db.jobApplication.update({
        where: { id },
        data: { order }
      })
    }

    // Transaction pour mettre à jour la candidature et insérer l'historique
    return db.$transaction(async (tx) => {
      const updatedJob = await tx.jobApplication.update({
        where: { id },
        data: {
          columnId: toColumnId,
          order
        }
      })

      await tx.jobApplicationHistory.create({
        data: {
          jobApplicationId: id,
          fromColumnId,
          toColumnId
        }
      })

      return updatedJob
    })
  }
}
