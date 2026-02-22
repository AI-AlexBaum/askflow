import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const categoryId = req.query.category_id as string | undefined;
  const status = req.query.status as string | undefined;
  const conditions: string[] = [];
  const params: any[] = [];
  if (categoryId) {
    conditions.push('category_id = ?');
    params.push(categoryId);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  let query = 'SELECT * FROM faq_items';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY sort_order';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  if (!row) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  res.json(row);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { category_id, question, answer, status = 'published' } = req.body;
  if (!category_id || !question || !answer) { res.status(400).json({ error: 'category_id, question and answer required' }); return; }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM faq_items WHERE category_id = ?').get(category_id) as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO faq_items (id, category_id, question, answer, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)').run(id, category_id, question, answer, sortOrder, status);
  const item = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { question, answer, sort_order, category_id, status } = req.body;
  const existing = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  db.prepare('UPDATE faq_items SET question = COALESCE(?, question), answer = COALESCE(?, answer), sort_order = COALESCE(?, sort_order), category_id = COALESCE(?, category_id), status = COALESCE(?, status) WHERE id = ?').run(question, answer, sort_order, category_id, status, req.params.id);
  const updated = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  db.prepare('DELETE FROM faq_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
