import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Évite d'instancier plusieurs connexions à la base de données en mode développement
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fallback dummy connection string for Next.js compilation phase (Docker builds)
const connectionString = process.env.DATABASE_URL || "postgresql://dummy_user:dummy_password@localhost:5432/dummy_db?schema=public"

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prisma = globalForPrisma.prisma
}

export const db = prisma
