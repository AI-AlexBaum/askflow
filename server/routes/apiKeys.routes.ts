import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { generateApiKey } from '../auth.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT id, name, key_prefix, is_active, last_used, created_at FROM api_keys ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: 'Name required' }); return; }
  const id = uuid();
  const { key, hash, prefix } = generateApiKey();
  db.prepare('INSERT INTO api_keys (id, name, key_hash, key_prefix, created_by) VALUES (?, ?, ?, ?, ?)').run(id, name, hash, prefix, req.user!.id);
  res.status(201).json({ id, name, key, key_prefix: prefix, created_at: new Date().toISOString() });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'API key not found' }); return; }
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
