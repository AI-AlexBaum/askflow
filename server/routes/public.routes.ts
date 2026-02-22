import { Router, Request, Response } from 'express';
import db from '../db.js';
import { buildProductTree } from '../utils/buildTree.js';
import { buildTemplateHtml } from '../utils/templateBuilder.js';

const router = Router();

router.get('/products', (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const categories = db.prepare('SELECT * FROM categories WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const items = db.prepare('SELECT * FROM faq_items WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const tree = buildProductTree(products, categories, items);
  res.json(tree);
});

router.get('/settings', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) { res.json([]); return; }

  try {
    // FTS5 search with ranking
    const rows = db.prepare(`
      SELECT fi.*, c.title as category_title, c.product_id, p.name as product_name, rank
      FROM faq_search fs
      JOIN faq_items fi ON fi.rowid = fs.rowid
      JOIN categories c ON fi.category_id = c.id
      JOIN products p ON c.product_id = p.id
      WHERE faq_search MATCH ?
        AND (fi.status = 'published' OR fi.status IS NULL)
        AND (c.status = 'published' OR c.status IS NULL)
        AND (p.status = 'published' OR p.status IS NULL)
      ORDER BY rank
      LIMIT 50
    `).all(q);
    res.json(rows);
  } catch {
    // Fallback to LIKE if FTS5 query syntax fails
    const pattern = `%${q}%`;
    const rows = db.prepare(`
      SELECT fi.*, c.title as category_title, c.product_id, p.name as product_name
      FROM faq_items fi
      JOIN categories c ON fi.category_id = c.id
      JOIN products p ON c.product_id = p.id
      WHERE (fi.question LIKE ? OR fi.answer LIKE ?)
        AND (fi.status = 'published' OR fi.status IS NULL)
        AND (c.status = 'published' OR c.status IS NULL)
        AND (p.status = 'published' OR p.status IS NULL)
      ORDER BY fi.sort_order
      LIMIT 50
    `).all(pattern, pattern);
    res.json(rows);
  }
});

router.get('/generated-template/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;

  const template = db.prepare(
    'SELECT * FROM generated_templates WHERE slug = ? AND is_active = 1'
  ).get(slug) as any;

  if (!template) {
    res.status(404).send('Template not found');
    return;
  }

  // Fetch products tree
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all() as any[];
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as any[];
  const items = db.prepare('SELECT * FROM faq_items ORDER BY sort_order').all() as any[];
  const tree = buildProductTree(products, categories, items);

  // Fetch settings
  const settingRows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of settingRows) settings[row.key] = row.value;

  const html = buildTemplateHtml(template, tree, settings);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
