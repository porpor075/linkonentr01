import { NextResponse } from 'next/server';
import { encryptSession, UserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const logPath = path.join(process.cwd(), 'api_debug.log');
  const log = (msg: string) => {
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] [AUTH_FULL] ${msg}\n`); } catch (e) {}
  };

  try {
    const { username, password } = await request.json();
    log(`Attempt: ${username}`);

    let session: UserSession | null = null;

    // 1. Check Database (Only if prisma is initialized)
    if (prisma) {
      try {
        const user = await (prisma as any).user.findUnique({
          where: { username: username }
        });

        if (user && user.password === password) {
          log(`DB Success: ${username}`);
          session = {
            id: user.id,
            username: user.username,
            name: user.fullName,
            role: [user.role as 'admin' | 'agent']
          };
        } else if (user) {
          log(`DB Pass Mismatch: ${username}`);
        }
      } catch (dbErr: any) {
        log(`DB Runtime Error: ${dbErr.message}`);
      }
    } else {
      log('Prisma not initialized (no DATABASE_URL)');
    }

    // 2. Fallback Mock
    if (!session) {
      if (username === 'admin' && password === 'password123') {
        log(`Mock Success: admin`);
        session = { id: 'admin-uuid', username: 'admin', name: 'NTR Admin', role: ['admin'] };
      } else if (username === 'agent' && password === 'password123') {
        log(`Mock Success: agent`);
        session = { id: 'agent-uuid', username: 'agent', name: 'NTR Agent', role: ['agent'] };
      }
    }

    if (!session) {
      log(`Rejected: ${username}`);
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const encryptedSession = encryptSession(session);
    const response = NextResponse.json({ success: true, role: session.role });
    
    response.cookies.set('ntr_session', encryptedSession, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 
    });

    log(`Cookie Set: ${username}`);
    return response;
  } catch (e: any) {
    log(`Global Error: ${e.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
