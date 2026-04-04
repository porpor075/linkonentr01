import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // เพิ่มข้อมูลจำลองสำหรับ Tier หากไม่มีใน Session จริง (จาก mock-db.ts หรืออื่นๆ)
  return NextResponse.json({
    ...session,
    fullName: session.name,
    tier: session.role.includes('admin') ? 'Platinum Admin' : 'Gold Agent'
  });
}
