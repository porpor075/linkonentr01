import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { IdentityHub } from '@/hubs/identityHub';

export async function GET() {
  const session = await getSession();
  
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = IdentityHub.getUsers().filter((u: any) => !u.deletedAt);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, fullName, role, password } = await request.json();
    const users = IdentityHub.getUsers();
    
    const newUser = {
      id: `u-${Date.now()}`,
      username,
      fullName,
      role: Array.isArray(role) ? role : [role],
      password: password || 'password123',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    IdentityHub.saveUsers(users);
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, role, fullName } = await request.json();
    const users = IdentityHub.getUsers();
    const idx = users.findIndex((u: any) => u.id === id);
    
    if (idx !== -1) {
      if (role) users[idx].role = Array.isArray(role) ? role : [role];
      if (fullName) users[idx].fullName = fullName;
      IdentityHub.saveUsers(users);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !session.role.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const users = IdentityHub.getUsers();
    const idx = users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      users[idx].deletedAt = new Date().toISOString();
      IdentityHub.saveUsers(users);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
