import { NextResponse } from 'next/server';
import addressData from '@/lib/data/master_data/address.json';

export async function GET() {
  return NextResponse.json(addressData);
}
