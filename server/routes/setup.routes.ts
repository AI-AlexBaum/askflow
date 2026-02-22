import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { hashPassword, createAccessToken, createRefreshToken } from '../auth.js';

const router = Router();

// GET /api/setup/status - check if setup is needed
router.get('/status', (_req: Request, res: Response) => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  res.json({ needsSetup: userCount === 0 });
});

// POST /api/setup - create first admin + initial settings
router.post('/', (req: Request, res: Response) => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 0) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  const { email, password, companyName, primaryColor, accentColor } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const userId = uuidv4();
  const passwordHash = hashPassword(password);

  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
    userId, email, passwordHash, 'Admin'
  );

  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  if (companyName) upsert.run('company_name', companyName);
  if (primaryColor) upsert.run('primary_color', primaryColor);
  if (accentColor) upsert.run('accent_color', accentColor);

  const accessToken = createAccessToken(userId, email);
  const refreshToken = createRefreshToken(userId, email);

  const useSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  res.json({
    ok: true,
    accessToken,
    user: { id: userId, email, name: 'Admin' },
  });
});

export default router;
