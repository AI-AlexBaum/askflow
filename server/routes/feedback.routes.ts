import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// POST /api/public/feedback
router.post('/', (req: Request, res: Response) => {
  const { faqItemId, helpful } = req.body;
  if (!faqItemId || helpful === undefined) {
    res.status(400).json({ error: 'faqItemId and helpful required' });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || '';
  const ipHash = crypto.createHash('sha256').update(ip + faqItemId).digest('hex').substring(0, 16);

  const existing = db.prepare('SELECT id FROM feedback WHERE ip_hash = ? AND faq_item_id = ?').get(ipHash, faqItemId);
  if (existing) {
    res.status(409).json({ error: 'Already submitted feedback' });
    return;
  }

  db.prepare('INSERT INTO feedback (id, faq_item_id, helpful, ip_hash) VALUES (?, ?, ?, ?)').run(
    uuidv4(), faqItemId, helpful ? 1 : 0, ipHash
  );
  res.json({ ok: true });
});

// GET /api/public/feedback/stats — admin stats
router.get('/stats', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT fi.id, fi.question,
      COUNT(f.id) as total,
      SUM(CASE WHEN f.helpful = 1 THEN 1 ELSE 0 END) as helpful_count,
      SUM(CASE WHEN f.helpful = 0 THEN 1 ELSE 0 END) as unhelpful_count
    FROM feedback f
    JOIN faq_items fi ON f.faq_item_id = fi.id
    GROUP BY fi.id
    ORDER BY total DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

export default router;
