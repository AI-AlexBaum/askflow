import { Router, Response } from 'express';
import db from '../db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth);

// GET /api/admin/data?format=json|csv
router.get('/', (req: AuthRequest, res: Response) => {
  const format = req.query.format || 'json';
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all() as any[];
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as any[];
  const items = db.prepare('SELECT * FROM faq_items ORDER BY sort_order').all() as any[];
  const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];

  if (format === 'csv') {
    const lines = ['product,category,question,answer,sort_order'];
    for (const item of items) {
      const cat = categories.find((c: any) => c.id === item.category_id);
      const prod = cat ? products.find((p: any) => p.id === cat.product_id) : null;
      const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      lines.push(`${escape(prod?.name || '')},${escape(cat?.title || '')},${escape(item.question)},${escape(item.answer)},${item.sort_order}`);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=askflow-export.csv');
    res.send(lines.join('\n'));
    return;
  }

  const settings: Record<string, string> = {};
  for (const row of settingsRows) settings[(row as any).key] = (row as any).value;

  function buildCategoryTree(productId: string, parentId: string | null): any[] {
    return categories
      .filter((c: any) => c.product_id === productId && c.parent_id === parentId)
      .map((c: any) => ({
        title: c.title,
        description: c.description,
        icon: c.icon,
        sort_order: c.sort_order,
        subcategories: buildCategoryTree(productId, c.id),
        items: items
          .filter((i: any) => i.category_id === c.id)
          .map((i: any) => ({ question: i.question, answer: i.answer, sort_order: i.sort_order })),
      }));
  }

  const data = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    settings,
    products: products.map((p: any) => ({
      name: p.name,
      description: p.description,
      sort_order: p.sort_order,
      categories: buildCategoryTree(p.id, null),
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=askflow-export.json');
  res.json(data);
});

// POST /api/admin/data — JSON import
router.post('/', (req: AuthRequest, res: Response) => {
  const { data, mode } = req.body;
  if (!data || !data.products) {
    res.status(400).json({ error: 'Invalid import data' });
    return;
  }

  const insertProduct = db.prepare('INSERT INTO products (id, name, description, sort_order) VALUES (?, ?, ?, ?)');
  const insertCategory = db.prepare('INSERT INTO categories (id, product_id, parent_id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO faq_items (id, category_id, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)');
  const upsertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');

  const transaction = db.transaction(() => {
    if (mode === 'replace') {
      db.prepare('DELETE FROM faq_items').run();
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM products').run();
    }

    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        if (typeof value === 'string') upsertSetting.run(key, value);
      }
    }

    for (const product of data.products) {
      const productId = uuidv4();
      insertProduct.run(productId, product.name, product.description || '', product.sort_order || 0);

      function importCategories(cats: any[], parentId: string | null) {
        for (const cat of cats || []) {
          const catId = uuidv4();
          insertCategory.run(catId, productId, parentId, cat.title, cat.description || '', cat.icon || '', cat.sort_order || 0);
          for (const item of cat.items || []) {
            insertItem.run(uuidv4(), catId, item.question, item.answer, item.sort_order || 0);
          }
          importCategories(cat.subcategories, catId);
        }
      }
      importCategories(product.categories, null);
    }
  });

  try {
    transaction();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

export default router;
