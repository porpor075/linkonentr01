import { NextResponse } from 'next/server';
import { getAllianzAccessToken, cancelAllianzContract } from '@/integrations/insurers/allianz';
import { getSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = body.reason || "User requested cancellation via Portal";

  try {
    const accessToken = await getAllianzAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to obtain Allianz access token' }, { status: 500 });
    }
    const result = await cancelAllianzContract(accessToken, contractId, reason);

    if (!result) {
      return NextResponse.json({ error: 'Allianz API Error' }, { status: 502 });
    }

    // ตรวจสอบ Error จาก Allianz
    if (result.fault || result.errors) {
      return NextResponse.json({ error: result }, { status: 400 });
    }

    // ในระบบจริง เราควรไปอัปเดตสถานะใน Database ของเราด้วย
    // ตัวอย่าง: await prisma.policy.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('[CANCEL_CONTRACT_ROUTE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
