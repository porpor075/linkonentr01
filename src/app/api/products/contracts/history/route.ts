import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PolicyHub } from '@/hubs/policyHub';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const policies = PolicyHub.getPolicies();
    
    // กรองเฉพาะงานของ User นั้นๆ (ยกเว้นแอดมินที่ดูได้หมด)
    if (session.role.includes('admin')) {
      return NextResponse.json(policies);
    }
    
    // กรองตาม userId ที่เราบันทึกไว้ใน RecordSale
    return NextResponse.json(policies.filter((p: any) => p.userId === session.id));
  } catch (e) {
    return NextResponse.json([]);
  }
}
