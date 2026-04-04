import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AnalyticsHub } from '@/hubs/analyticsHub';

export async function GET() {
  const session = await getSession();
  
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const salesData = AnalyticsHub.getSalesAnalytics();
    const financialData = AnalyticsHub.getFinancialReporting();

    return NextResponse.json({
      success: true,
      sales: salesData,
      financial: financialData
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
