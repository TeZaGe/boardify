import { db } from '@/lib/db'

const DEFAULT_COLUMNS = [
  { name: 'À postuler', order: 0, color: '#6b7280' },
  { name: 'Postulé', order: 1, color: '#3b82f6' },
  { name: 'Entretien', order: 2, color: '#f59e0b' },
  { name: 'Offre reçue', order: 3, color: '#10b981' },
  { name: 'Refusé', order: 4, color: '#ef4444' },
] as const

/**
 * Service gérant la logique métier des tableaux Kanban (Board).
 */
export class BoardService {
  /**
   * Retourne tous les tableaux d'un utilisateur avec les compteurs colonnes/candidatures.
   */
  static async getAll(userId: string) {
    return db.board.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        columns: {
          select: {
            id: true,
            name: true,
            order: true,
            color: true,
            boardId: true,
            _count: {
              select: { jobApplications: { where: { deletedAt: null } } }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  /**
   * Retourne un tableau spécifique avec ses colonnes et candidatures (données Kanban complètes).
   * Vérifie que le tableau appartient bien à l'utilisateur.
   */
  static async getById(boardId: string, userId: string) {
    return db.board.findUnique({
      where: { id: boardId, userId },
      include: {
        columns: {
          where: { userId },
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
        }
      }
    })
  }

  /**
   * Crée un nouveau tableau avec 5 colonnes par défaut.
   */
  static async create(
    userId: string,
    data: { name: string; emoji?: string; description?: string }
  ) {
    // Déterminer l'ordre du nouveau tableau
    const lastBoard = await db.board.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    const nextOrder = lastBoard ? lastBoard.order + 1 : 0

    return db.$transaction(async (tx: any) => {
      const board = await tx.board.create({
        data: {
          name: data.name,
          emoji: data.emoji ?? '📋',
          description: data.description,
          isDefault: false,
          order: nextOrder,
          userId
        }
      })

      await tx.column.createMany({
        data: DEFAULT_COLUMNS.map((col) => ({
          ...col,
          userId,
          boardId: board.id
        }))
      })

      return board
    })
  }

  /**
   * Met à jour les métadonnées d'un tableau (nom, emoji, description).
   * Vérifie que le tableau appartient bien à l'utilisateur.
   */
  static async update(
    boardId: string,
    userId: string,
    data: { name?: string; emoji?: string; description?: string }
  ) {
    return db.board.update({
      where: { id: boardId, userId },
      data
    })
  }

  /**
   * Supprime un tableau (les colonnes et candidatures sont supprimées en cascade via Prisma).
   * Vérifie que le tableau appartient bien à l'utilisateur.
   */
  static async delete(boardId: string, userId: string) {
    return db.board.delete({
      where: { id: boardId, userId }
    })
  }

  /**
   * Récupère le tableau par défaut de l'utilisateur, ou en crée un s'il n'en a aucun.
   * Utilisé pour la compatibilité ascendante lors de la connexion.
   */
  static async getOrCreateDefault(userId: string) {
    // 1. Chercher un tableau marqué isDefault
    const defaultBoard = await db.board.findFirst({
      where: { userId, isDefault: true },
      orderBy: { order: 'asc' }
    })

    if (defaultBoard) return defaultBoard

    // 2. Sinon, prendre le premier tableau disponible
    const firstBoard = await db.board.findFirst({
      where: { userId },
      orderBy: { order: 'asc' }
    })

    if (firstBoard) return firstBoard

    // 3. Aucun tableau n'existe — en créer un par défaut
    return db.$transaction(async (tx: any) => {
      const board = await tx.board.create({
        data: {
          name: "Ma recherche d'emploi",
          emoji: '🚀',
          isDefault: true,
          order: 0,
          userId
        }
      })

      await tx.column.createMany({
        data: DEFAULT_COLUMNS.map((col) => ({
          ...col,
          userId,
          boardId: board.id
        }))
      })

      return board
    })
  }
}
