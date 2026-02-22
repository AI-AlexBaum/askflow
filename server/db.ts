import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DATABASE_PATH || './data/faq.db';
const db = new Database(path.resolve(DB_PATH));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    created_by TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_used TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    parent_id TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS faq_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS generated_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    prompt_data TEXT NOT NULL,
    tsx_code TEXT NOT NULL,
    css_code TEXT NOT NULL,
    font TEXT DEFAULT 'Inter',
    font_url TEXT DEFAULT '',
    default_colors TEXT DEFAULT '{}',
    screenshot_url TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// Schema migrations: add new columns (safe to re-run, catches "already exists" errors)
try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`); } catch {}
try { db.exec(`ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'published'`); } catch {}
try { db.exec(`ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'published'`); } catch {}
try { db.exec(`ALTER TABLE faq_items ADD COLUMN status TEXT DEFAULT 'published'`); } catch {}

// Feedback table
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    faq_item_id TEXT NOT NULL,
    helpful INTEGER NOT NULL,
    ip_hash TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (faq_item_id) REFERENCES faq_items(id) ON DELETE CASCADE
  )
`);

// FTS5 virtual table for full-text search
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS faq_search USING fts5(
    question, answer, content=faq_items, content_rowid=rowid
  )
`);

// Populate FTS5 from existing data
try {
  const ftsCount = (db.prepare('SELECT COUNT(*) as c FROM faq_search').get() as any).c;
  if (ftsCount === 0) {
    db.exec(`INSERT INTO faq_search(rowid, question, answer) SELECT rowid, question, answer FROM faq_items`);
  }
} catch {}

// FTS5 sync triggers
db.exec(`
  CREATE TRIGGER IF NOT EXISTS faq_ai AFTER INSERT ON faq_items BEGIN
    INSERT INTO faq_search(rowid, question, answer) VALUES (new.rowid, new.question, new.answer);
  END
`);
db.exec(`
  CREATE TRIGGER IF NOT EXISTS faq_ad AFTER DELETE ON faq_items BEGIN
    INSERT INTO faq_search(faq_search, rowid, question, answer) VALUES ('delete', old.rowid, old.question, old.answer);
  END
`);
db.exec(`
  CREATE TRIGGER IF NOT EXISTS faq_au AFTER UPDATE ON faq_items BEGIN
    INSERT INTO faq_search(faq_search, rowid, question, answer) VALUES ('delete', old.rowid, old.question, old.answer);
    INSERT INTO faq_search(rowid, question, answer) VALUES (new.rowid, new.question, new.answer);
  END
`);

export default db;
