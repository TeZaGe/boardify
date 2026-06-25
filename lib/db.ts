import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Évite d'instancier plusieurs connexions à la base de données en mode développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getClient = () => {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma || getClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
