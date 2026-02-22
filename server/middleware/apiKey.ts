import { Request, Response, NextFunction } from 'express';
import { hashApiKey } from '../auth.js';
import db from '../db.js';

export interface ApiKeyRequest extends Request {
  apiKeyId?: string;
}

export function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'] as string;
  if (!key) {
    res.status(401).json({ error: 'API key required. Pass via X-API-Key header.' });
    return;
  }

  const hash = hashApiKey(key);
  const row = db.prepare('SELECT id FROM api_keys WHERE key_hash = ? AND is_active = 1').get(hash) as any;
  if (!row) {
    res.status(403).json({ error: 'Invalid or revoked API key' });
    return;
  }

  // Update last_used
  db.prepare('UPDATE api_keys SET last_used = datetime(\'now\') WHERE id = ?').run(row.id);
  req.apiKeyId = row.id;
  next();
}
