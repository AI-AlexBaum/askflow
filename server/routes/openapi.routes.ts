import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { buildProductTree, buildCategoryTree } from '../utils/buildTree.js';
import { requireApiKey } from '../middleware/apiKey.js';

const router = Router();
router.use(requireApiKey);

router.get('/products', (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const categories = db.prepare('SELECT * FROM categories WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const items = db.prepare('SELECT * FROM faq_items WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all() as any[];
  const tree = buildProductTree(products, categories, items);
  res.json(tree);
});

router.get('/products/:id', (req: Request, res: Response) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND (status = \'published\' OR status IS NULL)').get(req.params.id) as any;
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  const categories = db.prepare('SELECT * FROM categories WHERE product_id = ? AND (status = \'published\' OR status IS NULL) ORDER BY sort_order').all(req.params.id) as any[];
  const catIds = categories.map((c: any) => c.id);
  const items = catIds.length > 0
    ? db.prepare(`SELECT * FROM faq_items WHERE category_id IN (${catIds.map(() => '?').join(',')}) AND (status = 'published' OR status IS NULL) ORDER BY sort_order`).all(...catIds) as any[]
    : [];
  res.json({
    ...product,
    categories: buildCategoryTree(categories, items, null),
  });
});

router.get('/categories', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM categories WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all();
  res.json(rows);
});

router.get('/faq-items', (req: Request, res: Response) => {
  const categoryId = req.query.category_id as string | undefined;
  if (categoryId) {
    const rows = db.prepare('SELECT * FROM faq_items WHERE category_id = ? AND (status = \'published\' OR status IS NULL) ORDER BY sort_order').all(categoryId);
    res.json(rows);
  } else {
    const rows = db.prepare('SELECT * FROM faq_items WHERE status = \'published\' OR status IS NULL ORDER BY sort_order').all();
    res.json(rows);
  }
});

router.get('/faq-items/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM faq_items WHERE id = ? AND (status = \'published\' OR status IS NULL)').get(req.params.id);
  if (!row) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  res.json(row);
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

// POST /api/v1/ask — Chatbot-friendly: ask a question, get best matching FAQ answers
router.post('/ask', (req: Request, res: Response) => {
  const { question, product_id, limit = 5 } = req.body;
  if (!question) {
    res.status(400).json({ error: 'question is required' });
    return;
  }

  const q = question.trim();
  let rows: any[];

  try {
    // FTS5 search with relevance ranking
    let sql = `
      SELECT fi.id, fi.question, fi.answer, fi.category_id,
             c.title as category_title, c.product_id, p.name as product_name, rank
      FROM faq_search fs
      JOIN faq_items fi ON fi.rowid = fs.rowid
      JOIN categories c ON fi.category_id = c.id
      JOIN products p ON c.product_id = p.id
      WHERE faq_search MATCH ?
        AND (fi.status = 'published' OR fi.status IS NULL)
        AND (c.status = 'published' OR c.status IS NULL)
        AND (p.status = 'published' OR p.status IS NULL)
    `;
    const params: any[] = [q];
    if (product_id) {
      sql += ' AND p.id = ?';
      params.push(product_id);
    }
    sql += ` ORDER BY rank LIMIT ?`;
    params.push(Math.min(Number(limit), 20));
    rows = db.prepare(sql).all(...params);
  } catch {
    // Fallback to LIKE
    const pattern = `%${q}%`;
    let sql = `
      SELECT fi.id, fi.question, fi.answer, fi.category_id,
             c.title as category_title, c.product_id, p.name as product_name
      FROM faq_items fi
      JOIN categories c ON fi.category_id = c.id
      JOIN products p ON c.product_id = p.id
      WHERE (fi.question LIKE ? OR fi.answer LIKE ?)
        AND (fi.status = 'published' OR fi.status IS NULL)
    `;
    const params: any[] = [pattern, pattern];
    if (product_id) {
      sql += ' AND p.id = ?';
      params.push(product_id);
    }
    sql += ` ORDER BY fi.sort_order LIMIT ?`;
    params.push(Math.min(Number(limit), 20));
    rows = db.prepare(sql).all(...params);
  }

  // Strip markdown for plain text (simple removal of common markdown syntax)
  function stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/^>\s/gm, '')
      .trim();
  }

  const format = req.query.format as string;

  res.json({
    question: q,
    total_results: rows.length,
    answers: rows.map((r: any) => ({
      id: r.id,
      question: r.question,
      answer: format === 'text' ? stripMarkdown(r.answer) : r.answer,
      answer_plain: stripMarkdown(r.answer),
      category: r.category_title,
      product: r.product_name,
      product_id: r.product_id,
      category_id: r.category_id,
    })),
  });
});

// GET /api/v1/context — RAG bulk endpoint: all FAQ data in AI-friendly flat format
router.get('/context', (req: Request, res: Response) => {
  const productId = req.query.product_id as string | undefined;

  let sql = `
    SELECT fi.id, fi.question, fi.answer, fi.category_id,
           c.title as category_title, c.product_id, p.name as product_name
    FROM faq_items fi
    JOIN categories c ON fi.category_id = c.id
    JOIN products p ON c.product_id = p.id
    WHERE (fi.status = 'published' OR fi.status IS NULL)
      AND (c.status = 'published' OR c.status IS NULL)
      AND (p.status = 'published' OR p.status IS NULL)
  `;
  const params: any[] = [];
  if (productId) {
    sql += ' AND p.id = ?';
    params.push(productId);
  }
  sql += ' ORDER BY p.sort_order, c.sort_order, fi.sort_order';

  const rows = db.prepare(sql).all(...params) as any[];

  // Strip markdown for plain text
  function stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/^>\s/gm, '')
      .trim();
  }

  res.json({
    total: rows.length,
    updated_at: new Date().toISOString(),
    faqs: rows.map(r => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      answer_plain: stripMarkdown(r.answer),
      category: r.category_title,
      category_id: r.category_id,
      product: r.product_name,
      product_id: r.product_id,
    })),
  });
});

// =====================
// WRITE ENDPOINTS
// =====================

// POST /api/v1/products — Create a product
router.post('/products', (req: Request, res: Response) => {
  const { name, description = '', status = 'published' } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get() as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO products (id, name, description, sort_order, status) VALUES (?, ?, ?, ?, ?)').run(id, name, description, sortOrder, status);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(product);
});

// PUT /api/v1/products/:id — Update a product
router.put('/products/:id', (req: Request, res: Response) => {
  const { name, description, sort_order, status } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Product not found' }); return; }
  db.prepare('UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), sort_order = COALESCE(?, sort_order), status = COALESCE(?, status) WHERE id = ?').run(name, description, sort_order, status, req.params.id);
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/v1/products/:id — Delete a product
router.delete('/products/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Product not found' }); return; }
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/v1/categories — Create a category (use parent_id for nesting)
router.post('/categories', (req: Request, res: Response) => {
  const { product_id, parent_id = null, title, description = '', icon = '', status = 'published' } = req.body;
  if (!product_id || !title) { res.status(400).json({ error: 'product_id and title are required' }); return; }
  const productExists = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
  if (!productExists) { res.status(404).json({ error: 'Product not found' }); return; }
  if (parent_id) {
    const parentExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(parent_id);
    if (!parentExists) { res.status(404).json({ error: 'Parent category not found' }); return; }
  }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories WHERE product_id = ? AND parent_id IS ?').get(product_id, parent_id) as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO categories (id, product_id, parent_id, title, description, icon, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, product_id, parent_id, title, description, icon, sortOrder, status);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json(category);
});

// PUT /api/v1/categories/:id — Update a category
router.put('/categories/:id', (req: Request, res: Response) => {
  const { title, description, icon, sort_order, parent_id, status } = req.body;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  db.prepare('UPDATE categories SET title = COALESCE(?, title), description = COALESCE(?, description), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), parent_id = COALESCE(?, parent_id), status = COALESCE(?, status) WHERE id = ?').run(title, description, icon, sort_order, parent_id, status, req.params.id);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/v1/categories/:id — Delete a category (cascades to children)
router.delete('/categories/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/v1/faq-items — Create a FAQ item
router.post('/faq-items', (req: Request, res: Response) => {
  const { category_id, question, answer, status = 'published' } = req.body;
  if (!category_id || !question || !answer) { res.status(400).json({ error: 'category_id, question and answer are required' }); return; }
  const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
  if (!categoryExists) { res.status(404).json({ error: 'Category not found' }); return; }
  const id = uuid();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM faq_items WHERE category_id = ?').get(category_id) as any;
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO faq_items (id, category_id, question, answer, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)').run(id, category_id, question, answer, sortOrder, status);
  const item = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(id);
  res.status(201).json(item);
});

// PUT /api/v1/faq-items/:id — Update a FAQ item
router.put('/faq-items/:id', (req: Request, res: Response) => {
  const { question, answer, sort_order, category_id, status } = req.body;
  const existing = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  db.prepare('UPDATE faq_items SET question = COALESCE(?, question), answer = COALESCE(?, answer), sort_order = COALESCE(?, sort_order), category_id = COALESCE(?, category_id), status = COALESCE(?, status) WHERE id = ?').run(question, answer, sort_order, category_id, status, req.params.id);
  const updated = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/v1/faq-items/:id — Delete a FAQ item
router.delete('/faq-items/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'FAQ item not found' }); return; }
  db.prepare('DELETE FROM faq_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/v1/bulk-import — Import a complete tree structure (supports unlimited nesting)
router.post('/bulk-import', (req: Request, res: Response) => {
  const { data, mode = 'merge' } = req.body;
  if (!data || !data.products || !Array.isArray(data.products)) {
    res.status(400).json({ error: 'data.products array is required' });
    return;
  }

  const insertProduct = db.prepare('INSERT INTO products (id, name, description, sort_order, status) VALUES (?, ?, ?, ?, ?)');
  const insertCategory = db.prepare('INSERT INTO categories (id, product_id, parent_id, title, description, icon, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO faq_items (id, category_id, question, answer, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)');

  const created = { products: 0, categories: 0, faq_items: 0 };

  const transaction = db.transaction(() => {
    if (mode === 'replace') {
      db.prepare('DELETE FROM faq_items').run();
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM products').run();
    }

    for (const product of data.products) {
      if (!product.name) continue;
      const productId = uuid();
      const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get() as any;
      insertProduct.run(productId, product.name, product.description || '', (maxOrder?.m ?? -1) + 1, 'published');
      created.products++;

      function importCategories(cats: any[], parentId: string | null) {
        for (const cat of cats || []) {
          if (!cat.title) continue;
          const catId = uuid();
          const maxCatOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories WHERE product_id = ? AND parent_id IS ?').get(productId, parentId) as any;
          insertCategory.run(catId, productId, parentId, cat.title, cat.description || '', cat.icon || '', (maxCatOrder?.m ?? -1) + 1, 'published');
          created.categories++;
          for (const item of cat.items || []) {
            if (!item.question || !item.answer) continue;
            const maxItemOrder = db.prepare('SELECT MAX(sort_order) as m FROM faq_items WHERE category_id = ?').get(catId) as any;
            insertItem.run(uuid(), catId, item.question, item.answer, (maxItemOrder?.m ?? -1) + 1, 'published');
            created.faq_items++;
          }
          importCategories(cat.subcategories, catId);
        }
      }
      importCategories(product.categories, null);
    }
  });

  try {
    transaction();
    res.status(201).json({ ok: true, created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Import failed' });
  }
});

export default router;
