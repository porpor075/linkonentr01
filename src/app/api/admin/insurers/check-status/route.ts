import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllianzAccessToken } from '@/integrations/insurers/allianz';
import { BusinessHub } from '@/hubs/businessHub';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { insurerId, insurerNameEn } = await request.json();
  let statusData = { status: 'unknown', message: '' };

  try {
    if (insurerNameEn.toLowerCase().includes('allianz')) {
      const startTime = Date.now();
      const token = await getAllianzAccessToken();
      const duration = Date.now() - startTime;
      
      if (token) {
        statusData = { status: 'online', message: `เชื่อมต่อสำเร็จ (${duration}ms)` };
      }
    } else {
      statusData = { status: 'unknown', message: 'ยังไม่รองรับการเช็คสถานะ' };
    }
  } catch (error: any) {
    statusData = { status: 'offline', message: error.message || 'ขัดข้อง' };
  }

  try {
    if (prisma) {
      await prisma.insurer.update({
        where: { id: insurerId },
        data: {
          lastStatus: statusData.status,
          lastStatusMsg: statusData.message,
          lastChecked: new Date().toISOString()
        }
      });
    }
  } catch (e) {
    console.error('Save status failed', e);
  }

  return NextResponse.json({ ...statusData, lastChecked: new Date().toISOString() });
}
