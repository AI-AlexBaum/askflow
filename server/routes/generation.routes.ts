import { Router, Response } from 'express';
import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function getAnthropicClient(): Anthropic {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'anthropic_api_key'").get() as { value: string } | undefined;
  const apiKey = row?.value || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Set it in Settings or as ANTHROPIC_API_KEY env var.');
  }
  return new Anthropic({ apiKey });
}

async function fetchReferenceUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AskFlow-DesignAnalyzer/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = await res.text();
    // Extract key design signals from HTML
    const colorMatches = html.match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|hsl\([^)]+\))/g) || [];
    const fontMatches = html.match(/font-family:\s*([^;}"]+)/gi) || [];
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
    const uniqueColors = [...new Set(colorMatches)].slice(0, 20);
    const uniqueFonts = [...new Set(fontMatches)].slice(0, 10);
    return `
Reference URL Analysis (${url}):
- Page title: ${title}
- Description: ${metaDesc}
- Colors found: ${uniqueColors.join(', ') || 'none detected'}
- Font families: ${uniqueFonts.join(', ') || 'none detected'}
- The user wants the generated template to draw design inspiration from this reference page.`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString('hex');
  return `gen-${ts}-${rand}`;
}

interface PromptData {
  mood: string;
  colors: { bg: string; text: string; accent: string };
  layout: string;
  typography: string;
  freeText: string;
  referenceUrl?: string;
}

function buildSystemPrompt(promptData: PromptData): string {
  return `You are an expert React + CSS Modules developer. Your task is to generate a complete FAQ template consisting of a TSX component and a CSS Module file.

## TypeScript Interfaces (the component MUST use these exact types)

\`\`\`ts
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  subcategories?: FAQCategory[];
  items?: FAQItem[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  categories: FAQCategory[];
}

interface BrandSettings {
  company_name: string;
  tagline: string;
  primary_color: string;
  accent_color: string;
  logo_url: string;
  template: string;
  hero_title: string;
  search_placeholder: string;
  products_label: string;
  popular_label: string;
  no_results_text: string;
  footer_text: string;
  back_label: string;
  header_display: 'both' | 'name' | 'logo';
}

interface TemplateProps {
  products: Product[];
  settings: BrandSettings;
}
\`\`\`

## Component Requirements

1. **Export**: The TSX file MUST have a single default export: a React functional component that accepts \`{ products, settings }: TemplateProps\`.
2. **Imports**: The component MUST use these exact imports at the top:
   \`\`\`tsx
   import { useState, useMemo } from 'react';
   import type { TemplateProps } from '../types';
   import type { Product, FAQCategory, FAQItem } from '../../types';
   import s from './TEMPLATE_NAME.module.css';
   import DynamicIcon from '../IconMap';
   \`\`\`
   Replace TEMPLATE_NAME with a kebab-case name derived from the mood/style.

3. **Views**: Implement three views using a state discriminated union:
   - **home**: Shows all products with their categories, and a list of popular FAQ items (first 8).
   - **category**: Shows a single category's FAQ items (including subcategory items) with a back button.
   - **item**: Shows a single FAQ item's question and full answer, with a back button to the parent category.

4. **Search**: A search input in a hero section that filters across ALL FAQ items (question + answer text). When searching, show search results instead of the normal view. Flatten items from products > categories > subcategories > items for searching.

5. **Accordion expand/collapse**: FAQ items use an expand/collapse pattern. Only one item expanded at a time. Use CSS max-height transition for animation. Toggle state via \`expandedId\`.

6. **Accent color**: Use \`var(--accent)\` in CSS wherever the accent/brand color appears. Set it on the root element via inline style: \`style={{ '--accent': settings.primary_color } as React.CSSProperties}\`.

7. **Header**: Display company logo and name conditionally based on \`settings.header_display\`:
   - \`settings.header_display !== 'name' && settings.logo_url && <img ...>\`
   - \`settings.header_display !== 'logo' && <span>{settings.company_name}</span>\`
   Include a Home nav button.

8. **Configurable Text**: All user-facing text MUST use settings with fallback defaults:
   - Hero title: \`{settings.hero_title || 'How can we help?'}\`
   - Search placeholder: \`settings.search_placeholder || 'Search...'\`
   - Popular section: \`{settings.popular_label || 'Popular Questions'}\`
   - No results: \`{settings.no_results_text || 'No results found.'}\`
   - Back button: \`{settings.back_label || 'Back'}\`
   - Footer: \`{settings.footer_text || \\\`© \${new Date().getFullYear()} \${settings.company_name}\\\`}\`

9. **Footer**: Show footer text (configurable) and the tagline.

10. **Category Icons**: If a category has an \`icon\` field, render it. Import and use \`DynamicIcon\` from \`'../IconMap'\`:
    \`{cat.icon && <DynamicIcon name={cat.icon} size={16} />}\`

## CSS Module Requirements

1. Use CSS Modules syntax (plain class names like \`.root\`, \`.header\`, etc.).
2. Use \`var(--accent)\` for the brand/accent color throughout.
3. Be fully responsive with breakpoints at \`768px\` and \`390px\`.
4. All interactive elements (buttons, links) must have hover states and transitions.
5. Use the font family appropriate for the typography style, with system font fallbacks.
6. The root element should have \`min-height: 100vh\` and \`display: flex; flex-direction: column\`.
7. The footer should use \`margin-top: auto\` to stick to the bottom.

## Security Constraints (CRITICAL)

- NO \`<script>\` tags
- NO external resource loading (no \`<link>\`, no \`<img src="http...">\` except for settings.logo_url)
- NO \`eval()\`, \`Function()\`, \`dangerouslySetInnerHTML\`, or any dynamic code execution
- NO inline \`<style>\` tags (all styles go in the CSS module)
- NO \`import\` statements other than the five specified above
- NO \`useEffect\` or any side effects
- All SVG icons must be inline JSX (no external icon libraries)

## Design Direction

- **Mood / Style**: ${promptData.mood}
- **Color Palette**: Background: ${promptData.colors.bg}, Text: ${promptData.colors.text}, Accent: ${promptData.colors.accent}
- **Layout Style**: ${promptData.layout}
- **Typography**: ${promptData.typography}
- **Additional Instructions**: ${promptData.freeText || 'None'}

## Output Format

You MUST respond with EXACTLY two fenced code blocks and nothing else. No explanations, no markdown outside the code blocks.

First block: the TSX component (labeled \`tsx\`):
\`\`\`tsx
// ... complete component code here
\`\`\`

Second block: the CSS module (labeled \`css\`):
\`\`\`css
/* ... complete CSS module code here */
\`\`\`

## Example of Expected Output Structure

\`\`\`tsx
import { useState, useMemo } from 'react';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import s from './example-template.module.css';

type View =
  | { kind: 'home' }
  | { kind: 'category'; product: Product; category: FAQCategory }
  | { kind: 'item'; product: Product; category: FAQCategory; item: FAQItem };

interface FlatItem {
  product: Product;
  category: FAQCategory;
  item: FAQItem;
}

function flattenItems(products: Product[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const product of products) {
    for (const category of product.categories) {
      for (const item of category.items ?? []) {
        result.push({ product, category, item });
      }
      for (const sub of category.subcategories ?? []) {
        for (const item of sub.items ?? []) {
          result.push({ product, category: sub, item });
        }
      }
    }
  }
  return result;
}

function countItems(cat: FAQCategory): number {
  let count = (cat.items ?? []).length;
  for (const sub of cat.subcategories ?? []) count += countItems(sub);
  return count;
}

export default function ExampleTemplate({ products, settings }: TemplateProps) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allItems = useMemo(() => flattenItems(products), [products]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter(
      (fi) =>
        fi.item.question.toLowerCase().includes(q) ||
        fi.item.answer.toLowerCase().includes(q),
    );
  }, [search, allItems]);

  const isSearching = search.trim().length > 0;

  function toggleFaq(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function goHome() {
    setView({ kind: 'home' });
    setSearch('');
    setExpandedId(null);
  }

  function goCategory(product: Product, category: FAQCategory) {
    setView({ kind: 'category', product, category });
    setExpandedId(null);
  }

  function getCategoryItems(cat: FAQCategory): FAQItem[] {
    const items = [...(cat.items ?? [])];
    for (const sub of cat.subcategories ?? []) {
      items.push(...(sub.items ?? []));
    }
    return items;
  }

  return (
    <div className={s.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Header with logo, company name, nav */}
      <header className={s.header}>
        <div className={s.headerLogo}>
          {settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={s.logoImg} />}
          <span className={s.logoText}>{settings.company_name}</span>
        </div>
        <button className={s.navHome} onClick={goHome}>Home</button>
      </header>

      {/* Hero with search */}
      <section className={s.hero}>
        <h1 className={s.heroTitle}>How can we help?</h1>
        <p className={s.heroSub}>{settings.tagline}</p>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input className={s.searchInput} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </section>

      {/* Conditionally render: search results, home, category, or item view */}
      {/* ... full implementation of all views ... */}

      <footer className={s.footer}>
        <span>&copy; {new Date().getFullYear()} {settings.company_name}</span>
        <span>{settings.tagline}</span>
      </footer>
    </div>
  );
}
\`\`\`

\`\`\`css
.root {
  font-family: 'Inter', system-ui, sans-serif;
  color: #1a1a1a;
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
/* ... header, hero, search, products grid, faq accordion, category view, item view, footer, responsive breakpoints ... */
@media (max-width: 768px) { /* tablet adjustments */ }
@media (max-width: 390px) { /* mobile adjustments */ }
\`\`\`

IMPORTANT: Generate a COMPLETE, FULLY FUNCTIONAL component. Every view (home, category, item, search) must be fully implemented with real JSX. Do not use placeholder comments. The component must work as a drop-in replacement.`;
}

function extractCodeBlocks(response: string): { tsx: string; css: string } {
  const tsxMatch = response.match(/```tsx\n([\s\S]*?)```/);
  const cssMatch = response.match(/```css\n([\s\S]*?)```/);

  if (!tsxMatch || !cssMatch) {
    throw new Error('Failed to extract TSX and CSS code blocks from AI response');
  }

  return {
    tsx: tsxMatch[1].trim(),
    css: cssMatch[1].trim(),
  };
}

function validateGeneratedCode(tsx: string, css: string): string[] {
  const errors: string[] = [];

  // Security checks on TSX
  if (/<script[\s>]/i.test(tsx)) {
    errors.push('TSX contains forbidden <script> tag');
  }
  if (/\beval\s*\(/.test(tsx)) {
    errors.push('TSX contains forbidden eval()');
  }
  if (/\bFunction\s*\(/.test(tsx)) {
    errors.push('TSX contains forbidden Function()');
  }
  if (/dangerouslySetInnerHTML/.test(tsx)) {
    errors.push('TSX contains forbidden dangerouslySetInnerHTML');
  }
  if (/<style[\s>]/i.test(tsx)) {
    errors.push('TSX contains forbidden inline <style> tag');
  }

  // Security checks on CSS
  if (/@import\s/.test(css)) {
    errors.push('CSS contains forbidden @import');
  }
  if (/url\s*\(\s*['"]?https?:/.test(css)) {
    errors.push('CSS contains forbidden external URL');
  }

  // Structural checks on TSX
  if (!/export\s+default\s+function/.test(tsx)) {
    errors.push('TSX missing default function export');
  }
  if (!/useState/.test(tsx)) {
    errors.push('TSX missing useState (required for views and search)');
  }
  if (!/useMemo/.test(tsx)) {
    errors.push('TSX missing useMemo (required for search)');
  }
  if (!/var\(--accent\)/.test(css)) {
    errors.push('CSS missing var(--accent) usage');
  }

  return errors;
}

function deriveTemplateName(promptData: PromptData): string {
  const mood = promptData.mood.trim();
  // Capitalize first letter of each word, limit length
  const name = mood
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return name || 'Generated Template';
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /api/admin/generate-template
router.post('/generate-template', async (req: AuthRequest, res: Response) => {
  try {
    const { mood, colors, layout, typography, freeText, referenceUrl } = req.body;

    if (!mood || !colors || !layout || !typography) {
      res.status(400).json({ error: 'Missing required fields: mood, colors, layout, typography' });
      return;
    }

    if (!colors.bg || !colors.text || !colors.accent) {
      res.status(400).json({ error: 'Colors must include bg, text, and accent' });
      return;
    }

    const promptData: PromptData = { mood, colors, layout, typography, freeText: freeText || '', referenceUrl: referenceUrl || undefined };

    let referenceAnalysis = '';
    if (referenceUrl) {
      referenceAnalysis = await fetchReferenceUrl(referenceUrl);
    }

    const systemPrompt = buildSystemPrompt(promptData) + (referenceAnalysis ? `\n\n${referenceAnalysis}` : '');

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: `Generate a complete FAQ template with the following design direction:
- Mood: ${promptData.mood}
- Colors: bg=${promptData.colors.bg}, text=${promptData.colors.text}, accent=${promptData.colors.accent}
- Layout: ${promptData.layout}
- Typography: ${promptData.typography}
${promptData.freeText ? `- Additional: ${promptData.freeText}` : ''}

Produce the full TSX component and CSS module now. Remember: output ONLY the two fenced code blocks, nothing else.`,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content from the response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const { tsx, css } = extractCodeBlocks(responseText);

    // Validate generated code
    const validationErrors = validateGeneratedCode(tsx, css);
    if (validationErrors.length > 0) {
      res.status(422).json({
        error: 'Generated code failed validation',
        details: validationErrors,
      });
      return;
    }

    // Derive metadata
    const id = crypto.randomUUID();
    const slug = generateSlug();
    const name = deriveTemplateName(promptData);
    const userId = req.user!.id;

    // Determine font from typography
    const fontMap: Record<string, { font: string; fontUrl: string }> = {
      modern: { font: 'Inter', fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' },
      classic: { font: 'Merriweather', fontUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
      playful: { font: 'Nunito', fontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap' },
      elegant: { font: 'Playfair Display', fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap' },
      minimal: { font: 'Plus Jakarta Sans', fontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
      monospace: { font: 'JetBrains Mono', fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap' },
    };
    const typographyKey = typography.toLowerCase();
    const fontInfo = fontMap[typographyKey] || { font: 'Inter', fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' };

    const defaultColors = JSON.stringify(colors);

    db.prepare(`
      INSERT INTO generated_templates (id, name, slug, description, prompt_data, tsx_code, css_code, font, font_url, default_colors, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      name,
      slug,
      `AI-generated template with ${mood} mood, ${layout} layout`,
      JSON.stringify(promptData),
      tsx,
      css,
      fontInfo.font,
      fontInfo.fontUrl,
      defaultColors,
      userId,
    );

    const record = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(id);
    res.status(201).json(record);
  } catch (err: any) {
    console.error('Template generation error:', err);
    res.status(500).json({ error: 'Template generation failed', message: err.message });
  }
});

// GET /api/admin/generated-templates
router.get('/generated-templates', (_req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT * FROM generated_templates ORDER BY created_at DESC').all();
  res.json(rows);
});

// GET /api/admin/generated-templates/:id
router.get('/generated-templates/:id', (req: AuthRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Generated template not found' });
    return;
  }
  res.json(row);
});

// PUT /api/admin/generated-templates/:id/activate
router.put('/generated-templates/:id/activate', (req: AuthRequest, res: Response) => {
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') {
    res.status(400).json({ error: 'is_active must be a boolean' });
    return;
  }

  const existing = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Generated template not found' });
    return;
  }

  db.prepare("UPDATE generated_templates SET is_active = ?, updated_at = datetime('now') WHERE id = ?")
    .run(is_active ? 1 : 0, req.params.id);

  const updated = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/admin/generated-templates/:id
router.delete('/generated-templates/:id', (req: AuthRequest, res: Response) => {
  const existing = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Generated template not found' });
    return;
  }

  db.prepare('DELETE FROM generated_templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/generate-template/:id/regenerate
router.post('/generate-template/:id/regenerate', async (req: AuthRequest, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Generated template not found' });
      return;
    }

    const promptData: PromptData = JSON.parse(existing.prompt_data);
    const systemPrompt = buildSystemPrompt(promptData);

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: `Generate a complete FAQ template with the following design direction:
- Mood: ${promptData.mood}
- Colors: bg=${promptData.colors.bg}, text=${promptData.colors.text}, accent=${promptData.colors.accent}
- Layout: ${promptData.layout}
- Typography: ${promptData.typography}
${promptData.freeText ? `- Additional: ${promptData.freeText}` : ''}

Produce the full TSX component and CSS module now. Remember: output ONLY the two fenced code blocks, nothing else. Generate a fresh variation different from any previous attempt.`,
        },
      ],
      system: systemPrompt,
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const { tsx, css } = extractCodeBlocks(responseText);

    const validationErrors = validateGeneratedCode(tsx, css);
    if (validationErrors.length > 0) {
      res.status(422).json({
        error: 'Regenerated code failed validation',
        details: validationErrors,
      });
      return;
    }

    db.prepare(`
      UPDATE generated_templates
      SET tsx_code = ?, css_code = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(tsx, css, req.params.id);

    const updated = db.prepare('SELECT * FROM generated_templates WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    console.error('Template regeneration error:', err);
    res.status(500).json({ error: 'Template regeneration failed', message: err.message });
  }
});

export default router;
