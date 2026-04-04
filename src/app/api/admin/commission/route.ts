import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AnalyticsHub } from '@/hubs/analyticsHub';

export async function GET() {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(AnalyticsHub.getAllCommissions());
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json(); // { productId, userId, commissionRate }
  const comms = AnalyticsHub.getAllCommissions();
  
  const index = comms.findIndex((c: any) => c.productId === body.productId && c.userId === body.userId);
  
  if (index !== -1) {
    comms[index] = { 
      ...comms[index], 
      commissionRate: Number(body.commissionRate), 
      updatedAt: new Date().toISOString() 
    };
  } else {
    comms.push({ 
      id: `c-${Date.now()}`, 
      productId: body.productId,
      userId: body.userId || 'default',
      commissionRate: Number(body.commissionRate), 
      updatedAt: new Date().toISOString() 
    });
  }

  AnalyticsHub.saveCommissions(comms);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  let comms = AnalyticsHub.getAllCommissions();
  comms = comms.filter((c: any) => c.id !== id);
  
  AnalyticsHub.saveCommissions(comms);
  return NextResponse.json({ success: true });
}
