import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    /**
     * Automatically provision a default board + Kanban columns
     * and an extension token when a new user is created.
     */
    async createUser({ user }) {
      // Utiliser Web Crypto API (compatible Edge Runtime)
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      const token = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')

      // Créer le token d'extension et le tableau par défaut en parallèle
      await Promise.all([
        db.user.update({
          where: { id: user.id },
          data: { extensionToken: token },
        }),
        (async () => {
          const board = await db.board.create({
            data: {
              name: 'Ma recherche d\'emploi',
              emoji: '🚀',
              isDefault: true,
              order: 0,
              userId: user.id!,
            },
          })

          const defaultColumns = [
            { name: 'À postuler', order: 0, color: '#6b7280' },
            { name: 'Postulé', order: 1, color: '#3b82f6' },
            { name: 'Entretien', order: 2, color: '#f59e0b' },
            { name: 'Offre reçue', order: 3, color: '#10b981' },
            { name: 'Refusé', order: 4, color: '#ef4444' },
          ]

          await db.column.createMany({
            data: defaultColumns.map((col) => ({
              ...col,
              userId: user.id!,
              boardId: board.id,
            })),
          })
        })(),
      ])
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'database',
  },
})
