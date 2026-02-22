import { Router, Request, Response } from 'express';
import db from '../db.js';
import { verifyPassword, hashPassword, createAccessToken, createRefreshToken, verifyRefreshToken } from '../auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = createAccessToken(user.id, user.email);
  const refreshToken = createRefreshToken(user.id, user.email);

  const useSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: useSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post('/refresh', (req: Request, res: Response) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as any;
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const accessToken = createAccessToken(user.id, user.email);
  const newRefreshToken = createRefreshToken(user.id, user.email);

  const useSecureRefresh = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: useSecureRefresh,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ ok: true });
});

router.put('/password', requireAuth, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user!.id);
  res.json({ ok: true });
});

router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, email, currentPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const emailChanged = email && email !== user.email;

  if (emailChanged) {
    if (!currentPassword) {
      res.status(400).json({ error: 'Password is required to change email' });
      return;
    }
    if (!verifyPassword(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Password is incorrect' });
      return;
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user!.id) as any;
    if (existing) {
      res.status(409).json({ error: 'Email is already in use' });
      return;
    }
  }

  const newName = name !== undefined ? name : user.name;
  const newEmail = email || user.email;

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(newName, newEmail, req.user!.id);
  res.json({ user: { id: user.id, email: newEmail, name: newName } });
});

export default router;
