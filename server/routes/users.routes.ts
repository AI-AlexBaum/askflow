import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { hashPassword } from '../auth.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET / — list all users
router.get('/', (req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at').all();
  res.json(users);
});

// POST / — create/invite user
router.post('/', (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }
  const id = uuidv4();
  const passwordHash = hashPassword(password);
  db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').run(
    id, email, passwordHash, name, role || 'admin'
  );
  res.json({ id, email, name, role: role || 'admin' });
});

// PUT /:id/password — admin reset user password
router.put('/:id/password', (req: AuthRequest, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  const newHash = hashPassword(password);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.params.id);
  res.json({ ok: true });
});

// DELETE /:id — delete user (can't delete self)
router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
