import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!prisma) return NextResponse.json([]);

  try {
    const where = session.role.includes('admin') ? {} : { userId: session.id };
    
    const policies = await prisma.policy.findMany({
      where,
      include: {
        quotation: true,
        plan: {
          include: {
            insurer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(policies);
  } catch (e) {
    console.error('Failed to fetch policy history:', e);
    return NextResponse.json([]);
  }
}
