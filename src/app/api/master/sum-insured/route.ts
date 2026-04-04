import { NextRequest, NextResponse } from 'next/server';
import sumInsuredData from '@/lib/data/master_data/sum_insured.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const model = searchParams.get('model');
  const year = searchParams.get('year');

  if (!brand || !model || !year) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const data = (sumInsuredData as any)[brand]?.[model]?.[year];
  
  if (!data) {
    return NextResponse.json({ min: 100000, max: 2000000, default: true });
  }

  return NextResponse.json(data);
}
