import { NextResponse } from 'next/server';
import brands from '@/lib/data/master_data/brands.json';
import models from '@/lib/data/master_data/models.json';
import years from '@/lib/data/master_data/years.json';

export async function GET() {
  return NextResponse.json({
    brands,
    models,
    years
  });
}
