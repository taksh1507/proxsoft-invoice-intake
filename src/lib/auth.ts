import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export type Session = {
  userId: string;
  tenantId: string;
};

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-development-secret'
);

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as Session;
  } catch (error) {
    return null;
  }
}

export async function setSession(session: Session) {
  const token = await new SignJWT(session as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
