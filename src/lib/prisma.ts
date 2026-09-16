import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create PrismaClient if DATABASE_URL is available
const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    // Return a mock client during build if DATABASE_URL is not set
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('PrismaClient is not available during build. DATABASE_URL is not set.')
      }
    })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma