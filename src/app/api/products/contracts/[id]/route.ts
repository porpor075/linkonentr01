import { NextResponse } from 'next/server';
import { getAllianzAccessToken, getAllianzContract } from '@/integrations/insurers/allianz';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const session = await getSession();
  
  // ตรวจสอบ Login
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!contractId) {
    return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
  }

  try {
    const accessToken = await getAllianzAccessToken();
    const result = await getAllianzContract(accessToken, contractId);

    if (!result) {
      return NextResponse.json({ error: 'Allianz API Error' }, { status: 502 });
    }

    // หากพบ Error จาก Allianz (เช่น 404 ไม่บพบกรมธรรม์)
    if (result.fault || result.errors) {
      return NextResponse.json({ error: result }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET_CONTRACT_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
