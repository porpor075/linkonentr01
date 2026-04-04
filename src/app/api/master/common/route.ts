import { NextResponse } from 'next/server';
import nationality from '@/lib/data/master_data/nationality.json';
import title from '@/lib/data/master_data/title.json';
import occupation from '@/lib/data/master_data/occupation.json';
import vehicleColor from '@/lib/data/master_data/vehicle_color.json';

export async function GET() {
  return NextResponse.json({
    nationality,
    title,
    occupation,
    vehicleColor
  });
}
