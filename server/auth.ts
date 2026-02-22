import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

// --- Password hashing with scrypt ---

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verify;
}

// --- JWT with HMAC-SHA256 ---

interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

function base64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function sign(payload: object): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verify(token: string): JwtPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as JwtPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAccessToken(userId: string, email: string): string {
  return sign({
    sub: userId,
    email,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  });
}

export function createRefreshToken(userId: string, email: string): string {
  return sign({
    sub: userId,
    email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  const payload = verify(token);
  if (!payload || payload.type !== 'access') return null;
  return payload;
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  const payload = verify(token);
  if (!payload || payload.type !== 'refresh') return null;
  return payload;
}

// --- API key generation ---

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const key = `faq_${raw}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = `faq_${raw.slice(0, 8)}...`;
  return { key, hash, prefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
