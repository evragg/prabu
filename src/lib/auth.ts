import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'slb-tlm-inventory-default-secret-2026'
);

const SALT = process.env.PASSWORD_SALT || 'slb-tlm-inv-salt-x9k2';

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + SALT).digest('hex');
}

export interface AuthPayload {
  role: string;
  username?: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}
