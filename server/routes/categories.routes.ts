import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const productId = req.query.product_id as string | undefined;
  const status = req.query.status as string | undefined;
  const conditions: string[] = [];
  const params: any[] = [];
  if (productId) {
    conditions.push('product_id = ?');
    params.push(productId);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  let query = 'SELECT * FROM categories';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY sort_order';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json(row);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { product_id, parent_id = null, title, description = '', icon = '', status = 'published' } = req.body;
  if (!product_id || !title) { res.status(400).json({ error: 'product_id and title required' }); return; }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories WHERE product_id = ? AND parent_id IS ?').get(product_id, parent_id) as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO categories (id, product_id, parent_id, title, description, icon, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, product_id, parent_id, title, description, icon, sortOrder, status);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json(category);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { title, description, icon, sort_order, parent_id, status } = req.body;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  db.prepare('UPDATE categories SET title = COALESCE(?, title), description = COALESCE(?, description), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), parent_id = COALESCE(?, parent_id), status = COALESCE(?, status) WHERE id = ?').run(title, description, icon, sort_order, parent_id, status, req.params.id);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
