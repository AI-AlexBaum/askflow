import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `logo-${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();
router.use(requireAuth);

router.get('/', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.put('/', (req: AuthRequest, res: Response) => {
  const updates = req.body as Record<string, string>;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
    }
  });
  transaction();
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.post('/logo', upload.single('logo'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const logoUrl = `/uploads/${req.file.filename}`;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('logo_url', logoUrl);
  res.json({ logo_url: logoUrl });
});

export default router;
