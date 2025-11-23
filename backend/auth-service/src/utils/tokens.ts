import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { jwtConfig } from '../config/jwt';
import { randomUUID, randomBytes } from 'crypto';

export type AccessPayload = { id: string; email: string; role: string };

function normalizeExpiresIn(v: unknown): SignOptions['expiresIn'] {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // nếu là chuỗi toàn số => hiểu là số giây
    if (/^\d+$/.test(v)) return Number(v);
    return v as SignOptions['expiresIn']; // ví dụ '1h', '15m', '7d'
  }
  return '1h';
}

export function signAccess(payload: AccessPayload) {
  const jti = randomUUID();
  const opts: SignOptions = {
    expiresIn: normalizeExpiresIn(jwtConfig.expiresIn),
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  };
  const token = jwt.sign({ ...payload, jti }, jwtConfig.secret as Secret, opts);
  const decoded = jwt.decode(token) as { exp: number; jti: string };
  return { token, exp: decoded.exp, jti: decoded.jti };
}

export function verifyAccess(token: string) {
  return jwt.verify(token, jwtConfig.secret as Secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  }) as any;
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export async function hashOpaqueToken(opaque: string) {
  return bcrypt.hash(opaque, 10);
}

export async function compareOpaqueToken(opaque: string, hash: string) {
  return bcrypt.compare(opaque, hash);
}
