import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { AnalyticsHub } from '@/hubs/analyticsHub';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.id;
    const analytics = AnalyticsHub.getUserAnalytics(userId);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('User Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
