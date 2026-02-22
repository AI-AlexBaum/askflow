import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  let query = 'SELECT * FROM products';
  const params: any[] = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY sort_order';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(row);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, description = '', status = 'published' } = req.body;
  if (!name) { res.status(400).json({ error: 'Name required' }); return; }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get() as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO products (id, name, description, sort_order, status) VALUES (?, ?, ?, ?, ?)').run(id, name, description, sortOrder, status);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(product);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, description, sort_order, status } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Product not found' }); return; }
  db.prepare('UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), sort_order = COALESCE(?, sort_order), status = COALESCE(?, status) WHERE id = ?').run(name, description, sort_order, status, req.params.id);
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Product not found' }); return; }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
