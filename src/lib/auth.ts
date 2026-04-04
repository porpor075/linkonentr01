import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: ('admin' | 'agent')[];
}

const SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-dev-only';

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ntr_session');
  
  if (!sessionCookie) return null;

  try {
    const [payloadBase64, signature] = sessionCookie.value.split('.');
    
    // ตรวจสอบลายเซ็น (Verify Signature)
    const expectedSignature = createHmac('sha256', SECRET)
      .update(payloadBase64)
      .digest('base64');

    // ป้องกัน Timing Attack
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const decoded = Buffer.from(payloadBase64, 'base64').toString();
    return JSON.parse(decoded) as UserSession;
  } catch (e) {
    return null;
  }
}

export function encryptSession(session: UserSession): string {
  const payloadBase64 = Buffer.from(JSON.stringify(session)).toString('base64');
  const signature = createHmac('sha256', SECRET)
    .update(payloadBase64)
    .digest('base64');
  
  return `${payloadBase64}.${signature}`;
}
