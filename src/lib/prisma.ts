import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  try {
    const pool = new pg.Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false // จำเป็นสำหรับบางสภาวะแวดล้อมเพื่อรองรับ SSL ของ Neon
      }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error('Failed to initialize Prisma Client', e);
    return null;
  }
};

export const prisma = (globalForPrisma.prisma !== undefined) ? globalForPrisma.prisma : createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
