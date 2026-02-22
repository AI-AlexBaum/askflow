import { Router, Response } from 'express';
import db from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.put('/:entity', (req: AuthRequest, res: Response) => {
  const { entity } = req.params;
  const { ids } = req.body;

  const validEntities = ['products', 'categories', 'faq_items'];
  if (!validEntities.includes(entity)) {
    res.status(400).json({ error: 'Invalid entity' });
    return;
  }
  if (!Array.isArray(ids)) {
    res.status(400).json({ error: 'ids must be an array' });
    return;
  }

  const stmt = db.prepare(`UPDATE ${entity} SET sort_order = ? WHERE id = ?`);
  const transaction = db.transaction(() => {
    ids.forEach((id: string, index: number) => {
      stmt.run(index, id);
    });
  });

  transaction();
  res.json({ ok: true });
});

export default router;
