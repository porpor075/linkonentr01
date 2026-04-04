import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!prisma) return NextResponse.json([]);

  try {
    // แก้ไข Type Error: ใช้เงื่อนไขที่ Prisma เข้าใจได้ง่ายขึ้น
    const policies = await prisma.policy.findMany({
      where: session.role.includes('admin') ? {} : { quotation: { userId: session.id } },
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
