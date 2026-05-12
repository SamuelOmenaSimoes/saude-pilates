import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { getSessionCookieOptions } from './_core/cookies';

// JWT_SECRET must be set in environment variables for security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'CRITICAL: JWT_SECRET environment variable is not set. ' +
    'This is required for session security in both development and production.'
  );
}

const COOKIE_NAME = 'session';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

export function createSession(payload: SessionPayload, res: Response, req: Request): string {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token válido por 7 dias
  });

  const options = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, {
    ...options,
    maxAge: SEVEN_DAYS_MS,
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

export function clearSession(res: Response, req: Request): void {
  const options = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, options);
}

export { COOKIE_NAME };
