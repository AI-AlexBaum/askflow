import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';

dotenv.config();

// Ensure db is initialized
import db from './db.js';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import faqItemsRoutes from './routes/faqItems.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import apiKeysRoutes from './routes/apiKeys.routes.js';
import publicRoutes from './routes/public.routes.js';
import openapiRoutes from './routes/openapi.routes.js';
import generationRoutes from './routes/generation.routes.js';
import setupRoutes from './routes/setup.routes.js';
import usersRoutes from './routes/users.routes.js';
import exportRoutes from './routes/export.routes.js';
import reorderRoutes from './routes/reorder.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : undefined;

app.use(cors({
  origin: allowedOrigins || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
});

app.use('/api/public', apiLimiter);
app.use('/api/v1', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// Static uploads
app.use('/uploads', express.static(path.resolve('./uploads')));

// Wireframes (design prototypes)
app.use('/wireframes', express.static(path.resolve('./wireframes')));

// API Routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productsRoutes);
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin/faq-items', faqItemsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/api-keys', apiKeysRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/data', exportRoutes);
app.use('/api/admin/reorder', reorderRoutes);
app.use('/api/admin', generationRoutes);
app.use('/api/public/feedback', feedbackRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/v1', openapiRoutes);

// Swagger UI
try {
  const specPath = path.join(__dirname, 'openapi.yaml');
  const specFile = fs.readFileSync(specPath, 'utf-8');
  const swaggerDoc = YAML.parse(specFile);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AskFlow API Documentation',
  }));
} catch (e) {
  console.warn('OpenAPI spec not found, Swagger UI disabled');
}

// SEO: sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
  const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];
  const baseUrl = settingsRows.find((s: any) => s.key === 'base_url')?.value || `http://localhost:${PORT}`;
  const products = db.prepare("SELECT id, name FROM products WHERE status = 'published' OR status IS NULL ORDER BY sort_order").all() as any[];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;
  for (const p of products) {
    xml += `  <url><loc>${baseUrl}/?product=${p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  xml += '</urlset>';

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// SEO: robots.txt
app.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n`);
});

// Production: serve Vite build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');

  // Setup detection middleware: redirect to /setup if no users exist
  app.use((req, res, next) => {
    // Only redirect HTML page requests, not assets/API
    if (req.path.startsWith('/api/') || req.path.startsWith('/assets/') || req.path.startsWith('/uploads/') || req.path === '/setup') {
      return next();
    }
    const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (count === 0) {
      return res.redirect('/setup');
    }
    next();
  });

  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`AskFlow server running on http://localhost:${PORT}`);
});
