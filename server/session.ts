import jwt from 'jsonwebtoken';
import type { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const COOKIE_NAME = 'session';

export interface SessionPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

export function createSession(payload: SessionPayload, res: Response): string {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token válido por 7 dias
  });

  // Configurar cookie HTTP-only
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    path: '/',
  });

  return token;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export { COOKIE_NAME };
