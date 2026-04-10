import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development/production
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'], // Only log errors to avoid cluttering in production
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * 💡 Dica para erros de conexão (PgBouncer/Supabase):
 * Se estiver usando Supabase, prefira a porta 6543 (Modo Transação)
 * e adicione '?pgbouncer=true&connection_limit=1' na sua DATABASE_URL no Vercel.
 */

