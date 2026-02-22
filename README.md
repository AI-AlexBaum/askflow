<div align="center">

# AskFlow

### Your knowledge base, instantly beautiful.

**The open-source FAQ platform with 20+ stunning templates, a powerful admin panel, and an AI-ready API — deploy in 60 seconds.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](Dockerfile)

[Getting Started](#-quick-start) · [Templates](#-20-built-in-templates) · [AI Integration](#-ai--chatbot-integration) · [API Reference](#-api-reference) · [Deploy](#-deployment)

</div>

---

<div align="center">
<img src="docs/screenshots/template-stripe-minimal.png" alt="AskFlow — Stripe Minimal Template" width="100%" />
<br/><br/>
</div>

## Why teams choose AskFlow

| | |
|---|---|
| **Self-hosted** | Your data, your infrastructure. No SaaS fees. No vendor lock-in. |
| **White-label** | Logo, colors, company name — make it yours. |
| **20+ templates** | From Stripe-clean to Neon Cyberpunk. One click to switch. |
| **AI-first API** | Built for chatbots, LLMs, and RAG pipelines. OpenAPI 3.0. |
| **Zero config** | SQLite + single process. No Redis, no Postgres, no external services. |
| **AI template generation** | Describe a look → get a custom template. Powered by Claude. |

---

## Admin Panel

A full-featured dashboard to manage every aspect of your knowledge base.

<div align="center">
<img src="docs/screenshots/admin-dashboard.png" alt="Admin Dashboard" width="100%" />
</div>

<br/>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/admin-faq-items.png" alt="FAQ Management" /></td>
<td width="50%"><img src="docs/screenshots/admin-templates.png" alt="Template Gallery" /></td>
</tr>
<tr>
<td align="center"><strong>FAQ Management</strong> — Full CRUD with drag-and-drop reordering</td>
<td align="center"><strong>Template Gallery</strong> — 20+ templates, one-click activation</td>
</tr>
</table>

<details>
<summary><strong>More admin screenshots</strong></summary>
<br/>
<table>
<tr>
<td width="50%"><img src="docs/screenshots/admin-products.png" alt="Products" /></td>
<td width="50%"><img src="docs/screenshots/admin-categories.png" alt="Categories" /></td>
</tr>
<tr>
<td align="center"><strong>Products</strong></td>
<td align="center"><strong>Categories</strong> — Unlimited nesting depth</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/admin-settings.png" alt="Settings" /></td>
<td width="50%"><img src="docs/screenshots/admin-api-docs.png" alt="API Docs" /></td>
</tr>
<tr>
<td align="center"><strong>Settings</strong> — Brand, colors, SEO</td>
<td align="center"><strong>API Docs</strong> — In-app endpoint reference</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/admin-users.png" alt="Users" /></td>
<td width="50%"><img src="docs/screenshots/admin-profile.png" alt="Profile" /></td>
</tr>
<tr>
<td align="center"><strong>User Management</strong></td>
<td align="center"><strong>Profile</strong></td>
</tr>
</table>
</details>

### What you get

- Products, categories, and FAQ items with full CRUD
- **Unlimited nested categories** — sub-sub-sub-subcategories, no limits
- Markdown editor for rich FAQ answers
- Drag-and-drop reordering
- User management with role-based access
- API key management for external integrations
- In-app API documentation + Swagger UI
- Feedback analytics dashboard
- Data import/export (JSON & CSV)

---

## 20+ Built-in Templates

One click in the admin panel switches your entire FAQ look. Every template is responsive and production-ready.

<table>
<tr>
<td width="33%"><img src="docs/screenshots/template-stripe-minimal.png" alt="Stripe Minimal" /><br/><div align="center"><strong>Stripe Minimal</strong><br/><sub>Clean docs, inspired by Stripe</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-vercel-dark.png" alt="Vercel Dark" /><br/><div align="center"><strong>Vercel Dark</strong><br/><sub>Sharp dark theme</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-neon-cyberpunk.png" alt="Neon Cyberpunk" /><br/><div align="center"><strong>Neon Cyberpunk</strong><br/><sub>Glowing neon aesthetic</sub></div></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/template-notion-clean.png" alt="Notion Clean" /><br/><div align="center"><strong>Notion Clean</strong><br/><sub>Minimal & content-focused</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-banking-corporate.png" alt="Banking Corporate" /><br/><div align="center"><strong>Banking Corporate</strong><br/><sub>Professional & trustworthy</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-intercom-fresh.png" alt="Intercom Fresh" /><br/><div align="center"><strong>Intercom Fresh</strong><br/><sub>Friendly help center</sub></div></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/template-luxury-gold.png" alt="Luxury Gold" /><br/><div align="center"><strong>Luxury Gold</strong><br/><sub>Black & gold elegance</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-glassmorphism-premium.png" alt="Glassmorphism Premium" /><br/><div align="center"><strong>Glassmorphism Premium</strong><br/><sub>Frosted glass effects</sub></div></td>
<td width="33%"><img src="docs/screenshots/template-zen-garden.png" alt="Zen Garden" /><br/><div align="center"><strong>Zen Garden</strong><br/><sub>Japanese minimalism</sub></div></td>
</tr>
</table>

<details>
<summary><strong>See all 20 templates</strong></summary>
<br/>
<table>
<tr>
<td width="33%"><img src="docs/screenshots/template-linear-dashboard.png" alt="Linear Dashboard" /><br/><div align="center"><strong>Linear Dashboard</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-swiss-minimal.png" alt="Swiss Minimal" /><br/><div align="center"><strong>Swiss Minimal</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-editorial-grid.png" alt="Editorial Grid" /><br/><div align="center"><strong>Editorial Grid</strong></div></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/template-startup-bold.png" alt="Startup Bold" /><br/><div align="center"><strong>Startup Bold</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-colorful-playful.png" alt="Colorful Playful" /><br/><div align="center"><strong>Colorful Playful</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-retro-vintage.png" alt="Retro Vintage" /><br/><div align="center"><strong>Retro Vintage</strong></div></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/template-brutalist-raw.png" alt="Brutalist Raw" /><br/><div align="center"><strong>Brutalist Raw</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-warm-earthy.png" alt="Warm Earthy" /><br/><div align="center"><strong>Warm Earthy</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-soft-pastel.png" alt="Soft Pastel" /><br/><div align="center"><strong>Soft Pastel</strong></div></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/template-monochrome-elegant.png" alt="Monochrome Elegant" /><br/><div align="center"><strong>Monochrome Elegant</strong></div></td>
<td width="33%"><img src="docs/screenshots/template-gradient-mesh.png" alt="Gradient Mesh" /><br/><div align="center"><strong>Gradient Mesh</strong></div></td>
<td></td>
</tr>
</table>
</details>

### AI-Generated Templates

Don't see what you need? **Describe it** and AskFlow generates a custom template using Claude.

> *"dark theme with neon green accents and monospace font"* → Done.

1. Set `ANTHROPIC_API_KEY` in your `.env`
2. Go to **Admin > AI Generator**
3. Describe the look you want
4. AskFlow generates a complete, production-ready template

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/AI-AlexBaum/askflow.git
cd askflow
cp .env.example .env
docker compose up -d
```

### Manual Setup

```bash
git clone https://github.com/AI-AlexBaum/askflow.git
cd askflow
npm install
cp .env.example .env
npm run build
npm start
```

### Interactive Installer

```bash
git clone https://github.com/AI-AlexBaum/askflow.git
cd askflow
bash install.sh
```

> The installer checks prerequisites, installs dependencies, builds the app, generates a secure `.env`, and optionally sets up a systemd service.

Open `http://localhost:3001` — the setup wizard will guide you through creating your admin account, choosing your brand name, and picking colors.

**Want sample data?**

```bash
npm run seed
# Login: admin@example.com / admin123
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | — | **Required in production.** `openssl rand -hex 32` |
| `DATABASE_PATH` | `./data/faq.db` | SQLite database path |
| `ANTHROPIC_API_KEY` | — | Enables AI template generation |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins |

---

## AI & Chatbot Integration

AskFlow is designed to be the **knowledge backbone** for AI chatbots and assistants.

<div align="center">
<img src="docs/screenshots/swagger-ui.png" alt="Swagger UI — Interactive API docs" width="100%" />
<br/><sub>Interactive API documentation with Swagger UI at <code>/api/docs</code></sub>
<br/><br/>
</div>

All `/api/v1` endpoints require an API key via `X-API-Key` header. Create keys in **Admin > API Keys**.

### Ask a Question (ideal for chatbots)

```bash
curl -X POST https://your-domain.com/api/v1/ask \
  -H "X-API-Key: faq_your_key" \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I reset my password?"}'
```

Returns ranked answers with `answer_plain` (no Markdown) — perfect for bot responses.

### Full-text Search

```bash
curl -H "X-API-Key: faq_your_key" \
  "https://your-domain.com/api/v1/search?q=reset+password"
```

### RAG / Vector Store Population

```bash
curl -H "X-API-Key: faq_your_key" \
  https://your-domain.com/api/v1/context
```

Returns all FAQ data in a flat, AI-friendly format. Feed directly into your vector database.

### Bulk Import (unlimited nesting depth)

```bash
curl -X POST https://your-domain.com/api/v1/bulk-import \
  -H "X-API-Key: faq_your_key" -H "Content-Type: application/json" \
  -d '{
    "mode": "merge",
    "data": {
      "products": [{
        "name": "Help Center",
        "categories": [{
          "title": "Account",
          "subcategories": [{
            "title": "Billing",
            "subcategories": [{
              "title": "Invoices",
              "items": [{"question": "Where are my invoices?", "answer": "Go to **Settings > Billing**."}]
            }]
          }]
        }]
      }]
    }
  }'
```

### Integration Examples

<details>
<summary><strong>Claude / ChatGPT — Tool Use</strong></summary>

```json
{
  "name": "search_faq",
  "description": "Search the company FAQ knowledge base for answers",
  "input_schema": {
    "type": "object",
    "properties": {
      "question": { "type": "string", "description": "The user's question" }
    },
    "required": ["question"]
  }
}
```

Your tool handler calls `POST /api/v1/ask` and returns the top answers to the LLM.
</details>

<details>
<summary><strong>LangChain / LlamaIndex — RAG Pipeline</strong></summary>

```python
import requests

data = requests.get(
    "https://your-domain.com/api/v1/context",
    headers={"X-API-Key": "faq_your_key"}
).json()

for faq in data["faqs"]:
    vector_store.add(
        text=f"Q: {faq['question']}\nA: {faq['answer_plain']}",
        metadata={"product": faq["product"], "category": faq["category"]}
    )
```
</details>

<details>
<summary><strong>Botpress / Dialogflow / Rasa</strong></summary>

Use `/api/v1/ask` as a webhook action — map the user's message to the `question` field, return `answers[0].answer_plain` as the bot response.
</details>

<details>
<summary><strong>Programmatic FAQ Management</strong></summary>

```python
import requests

API = "https://your-domain.com/api/v1"
H = {"X-API-Key": "faq_your_key", "Content-Type": "application/json"}

product = requests.post(f"{API}/products", headers=H,
    json={"name": "Docs"}).json()

parent = requests.post(f"{API}/categories", headers=H,
    json={"product_id": product["id"], "title": "Setup"}).json()

child = requests.post(f"{API}/categories", headers=H,
    json={"product_id": product["id"], "parent_id": parent["id"], "title": "Linux"}).json()

requests.post(f"{API}/faq-items", headers=H,
    json={"category_id": child["id"],
          "question": "How to install on Ubuntu?",
          "answer": "Run `sudo apt install myapp`"})
```
</details>

---

## API Reference

### Read Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/products` | Products with nested category tree |
| `GET` | `/api/v1/products/:id` | Single product with tree |
| `GET` | `/api/v1/categories` | All categories (flat) |
| `GET` | `/api/v1/faq-items` | FAQ items (optional `?category_id=`) |
| `GET` | `/api/v1/faq-items/:id` | Single FAQ item |
| `GET` | `/api/v1/search?q=` | Full-text search |
| `POST` | `/api/v1/ask` | Chatbot Q&A endpoint |
| `GET` | `/api/v1/context` | All data for RAG pipelines |

### Write Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/products` | Create product |
| `PUT` | `/api/v1/products/:id` | Update product |
| `DELETE` | `/api/v1/products/:id` | Delete product |
| `POST` | `/api/v1/categories` | Create category (`parent_id` for nesting) |
| `PUT` | `/api/v1/categories/:id` | Update category |
| `DELETE` | `/api/v1/categories/:id` | Delete category (cascades) |
| `POST` | `/api/v1/faq-items` | Create FAQ item |
| `PUT` | `/api/v1/faq-items/:id` | Update FAQ item |
| `DELETE` | `/api/v1/faq-items/:id` | Delete FAQ item |
| `POST` | `/api/v1/bulk-import` | Bulk import tree structure |

### Public Endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/public/products` | Product tree |
| `GET` | `/api/public/settings` | Branding settings |
| `GET` | `/api/public/search?q=` | Search |

> Interactive Swagger UI docs at `/api/docs`

---

## Deployment

### Docker Compose

```yaml
services:
  askflow:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    env_file: .env
    restart: unless-stopped
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name faq.example.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS v4, Vite 6 |
| Backend | Express 4.21, better-sqlite3, TypeScript |
| Auth | JWT (HMAC-SHA256), scrypt password hashing |
| Search | SQLite FTS5 full-text search |
| API Docs | OpenAPI 3.0, Swagger UI |
| AI | Anthropic Claude (optional) |

---

## Security

- JWT authentication with access + refresh tokens
- scrypt password hashing
- API key authentication with SHA-256 hashing
- Rate limiting (100 req/min API, 10 req/min auth)
- httpOnly cookies for refresh tokens
- CORS configuration
- Schema.org FAQ structured data (JSON-LD)
- Auto-generated sitemap.xml and robots.txt

---

## License

MIT — use it however you want.

---

<div align="center">
<br/>
<strong>Built with modern tools. Designed for AI.</strong>
<br/><br/>
<sub>If AskFlow helps your project, a star would be appreciated.</sub>
</div>
