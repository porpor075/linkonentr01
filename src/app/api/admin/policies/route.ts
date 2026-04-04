import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PolicyHub } from '@/hubs/policyHub';

export async function GET() {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(PolicyHub.getPolicies());
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, policyNumber, status } = await request.json();
    const policies = PolicyHub.getPolicies();
    const index = policies.findIndex((p: any) => p.id === id);
    
    if (index !== -1) {
      policies[index] = { ...policies[index], policyNumber, status: status || 'SUCCESS' };
      PolicyHub.savePolicies(policies);
      return NextResponse.json(policies[index]);
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
