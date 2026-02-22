import { useState } from 'react';
import { BookOpen, ExternalLink, Copy, Check, Code2, Search, MessageSquare, Database } from 'lucide-react';
import { AdminPageHeader } from '../components';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  icon: typeof Code2;
  curl: string;
  responseFields: string[];
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/products',
    description: 'List all products with nested categories and FAQ items.',
    icon: Database,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://your-domain.com/api/v1/products`,
    responseFields: ['id', 'name', 'description', 'categories[]'],
  },
  {
    method: 'GET',
    path: '/api/v1/products/:id',
    description: 'Get a single product with its full category tree.',
    icon: Database,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://your-domain.com/api/v1/products/PRODUCT_ID`,
    responseFields: ['id', 'name', 'description', 'categories[]'],
  },
  {
    method: 'GET',
    path: '/api/v1/categories',
    description: 'List all categories in a flat structure.',
    icon: Code2,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://your-domain.com/api/v1/categories`,
    responseFields: ['id', 'product_id', 'parent_id', 'title', 'description', 'icon', 'sort_order'],
  },
  {
    method: 'GET',
    path: '/api/v1/faq-items',
    description: 'List FAQ items. Optionally filter by category_id.',
    icon: Code2,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://your-domain.com/api/v1/faq-items?category_id=CATEGORY_ID`,
    responseFields: ['id', 'question', 'answer'],
  },
  {
    method: 'GET',
    path: '/api/v1/faq-items/:id',
    description: 'Get a single FAQ item by ID.',
    icon: Code2,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  https://your-domain.com/api/v1/faq-items/FAQ_ITEM_ID`,
    responseFields: ['id', 'question', 'answer'],
  },
  {
    method: 'GET',
    path: '/api/v1/search?q=',
    description: 'Full-text search across all FAQ items with relevance ranking.',
    icon: Search,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/search?q=how+do+I+reset"`,
    responseFields: ['id', 'question', 'answer', 'category_title', 'product_name'],
  },
  {
    method: 'POST',
    path: '/api/v1/ask',
    description: 'Ask a natural language question and get the best matching FAQ answers. Ideal for chatbot integrations.',
    icon: MessageSquare,
    curl: `curl -X POST https://your-domain.com/api/v1/ask \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "How do I reset my password?", "limit": 5}'`,
    responseFields: ['question', 'total_results', 'answers[].id', 'answers[].question', 'answers[].answer', 'answers[].answer_plain', 'answers[].category', 'answers[].product'],
  },
  {
    method: 'GET',
    path: '/api/v1/context',
    description: 'Get all FAQ data in a flat, AI-friendly format for RAG and knowledge base population.',
    icon: Database,
    curl: `curl -H "X-API-Key: YOUR_API_KEY" \\
  "https://your-domain.com/api/v1/context?product_id=PRODUCT_ID"`,
    responseFields: ['total', 'updated_at', 'faqs[].id', 'faqs[].question', 'faqs[].answer', 'faqs[].answer_plain', 'faqs[].category', 'faqs[].product'],
  },
];

const writeEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/products',
    description: 'Create a new product.',
    icon: Database,
    curl: `curl -X POST https://your-domain.com/api/v1/products \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Product", "description": "Product description"}'`,
    responseFields: ['id', 'name', 'description', 'sort_order', 'status'],
  },
  {
    method: 'PUT',
    path: '/api/v1/products/:id',
    description: 'Update an existing product.',
    icon: Database,
    curl: `curl -X PUT https://your-domain.com/api/v1/products/PRODUCT_ID \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Name"}'`,
    responseFields: ['id', 'name', 'description', 'sort_order', 'status'],
  },
  {
    method: 'DELETE',
    path: '/api/v1/products/:id',
    description: 'Delete a product and all its categories/items.',
    icon: Database,
    curl: `curl -X DELETE https://your-domain.com/api/v1/products/PRODUCT_ID \\
  -H "X-API-Key: YOUR_API_KEY"`,
    responseFields: ['ok'],
  },
  {
    method: 'POST',
    path: '/api/v1/categories',
    description: 'Create a category. Use parent_id for nesting at any depth (sub-sub-sub-subcategories supported).',
    icon: Code2,
    curl: `curl -X POST https://your-domain.com/api/v1/categories \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_id": "PRODUCT_ID", "parent_id": "PARENT_CAT_ID", "title": "Subcategory"}'`,
    responseFields: ['id', 'product_id', 'parent_id', 'title', 'description', 'icon', 'sort_order'],
  },
  {
    method: 'PUT',
    path: '/api/v1/categories/:id',
    description: 'Update a category.',
    icon: Code2,
    curl: `curl -X PUT https://your-domain.com/api/v1/categories/CATEGORY_ID \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Updated Title"}'`,
    responseFields: ['id', 'product_id', 'parent_id', 'title', 'description'],
  },
  {
    method: 'DELETE',
    path: '/api/v1/categories/:id',
    description: 'Delete a category (cascades to all children and FAQ items).',
    icon: Code2,
    curl: `curl -X DELETE https://your-domain.com/api/v1/categories/CATEGORY_ID \\
  -H "X-API-Key: YOUR_API_KEY"`,
    responseFields: ['ok'],
  },
  {
    method: 'POST',
    path: '/api/v1/faq-items',
    description: 'Create a FAQ item in a category.',
    icon: MessageSquare,
    curl: `curl -X POST https://your-domain.com/api/v1/faq-items \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"category_id": "CAT_ID", "question": "How do I...?", "answer": "You can..."}'`,
    responseFields: ['id', 'category_id', 'question', 'answer', 'sort_order'],
  },
  {
    method: 'PUT',
    path: '/api/v1/faq-items/:id',
    description: 'Update a FAQ item.',
    icon: MessageSquare,
    curl: `curl -X PUT https://your-domain.com/api/v1/faq-items/FAQ_ITEM_ID \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answer": "Updated answer with **markdown** support"}'`,
    responseFields: ['id', 'question', 'answer', 'sort_order'],
  },
  {
    method: 'DELETE',
    path: '/api/v1/faq-items/:id',
    description: 'Delete a FAQ item.',
    icon: MessageSquare,
    curl: `curl -X DELETE https://your-domain.com/api/v1/faq-items/FAQ_ITEM_ID \\
  -H "X-API-Key: YOUR_API_KEY"`,
    responseFields: ['ok'],
  },
  {
    method: 'POST',
    path: '/api/v1/bulk-import',
    description: 'Import a complete tree structure in one call. Supports unlimited nesting depth. Mode: "merge" (add) or "replace" (overwrite all).',
    icon: Database,
    curl: `curl -X POST https://your-domain.com/api/v1/bulk-import \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "merge",
    "data": {
      "products": [{
        "name": "Product",
        "categories": [{
          "title": "Level 1",
          "subcategories": [{
            "title": "Level 2",
            "items": [{"question": "Q?", "answer": "A."}]
          }]
        }]
      }]
    }
  }'`,
    responseFields: ['ok', 'created.products', 'created.categories', 'created.faq_items'],
  },
];

function CodeBlock({ code, id }: { code: string; id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 text-sm font-mono p-4 rounded-xl overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' }) {
  const styles =
    method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
    method === 'POST' ? 'bg-blue-100 text-blue-700' :
    method === 'PUT' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide ${styles}`}>
      {method}
    </span>
  );
}

export default function AdminApiDocs() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="API Documentation"
        subtitle="Integrate your FAQ data with chatbots, AI assistants, and external services."
      />

      {/* Quick Start */}
      <div className="card-modern p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-800">Quick Start</h3>
        </div>
        <p className="text-sm text-slate-600 mb-1">
          All API requests require authentication via the <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded font-mono">X-API-Key</code> header.
        </p>
        <p className="text-sm text-slate-600 mb-4">
          Create and manage your API keys on the{' '}
          <a href="/admin/api-keys" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">API Keys</a> page.
        </p>
        <CodeBlock
          id="quickstart"
          code={`curl -H "X-API-Key: faq_your-api-key" \\
  https://your-domain.com/api/v1/products`}
        />
      </div>

      {/* Swagger UI Link */}
      <a
        href="/api/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="card-modern p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Interactive API Explorer (Swagger UI)</p>
            <p className="text-xs text-slate-500">Try endpoints directly in your browser with live requests</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </a>

      {/* Endpoints Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Endpoints</h3>

        {endpoints.map((ep, index) => (
          <div key={index} className="card-modern p-5">
            <div className="flex items-start gap-3 mb-3">
              <MethodBadge method={ep.method} />
              <code className="text-sm font-mono font-semibold text-slate-800 break-all">{ep.path}</code>
            </div>
            <p className="text-sm text-slate-600 mb-4">{ep.description}</p>

            <div className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Example Request</p>
              <CodeBlock id={`endpoint-${index}`} code={ep.curl} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Response Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {ep.responseFields.map((field) => (
                  <code
                    key={field}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                  >
                    {field}
                  </code>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Write Endpoints Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Write Endpoints</h3>
        <p className="text-sm text-slate-500">Create, update and delete products, categories (with unlimited nesting) and FAQ items via the API.</p>

        {writeEndpoints.map((ep, index) => (
          <div key={index} className="card-modern p-5">
            <div className="flex items-start gap-3 mb-3">
              <MethodBadge method={ep.method} />
              <code className="text-sm font-mono font-semibold text-slate-800 break-all">{ep.path}</code>
            </div>
            <p className="text-sm text-slate-600 mb-4">{ep.description}</p>

            <div className="mb-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Example Request</p>
              <CodeBlock id={`write-endpoint-${index}`} code={ep.curl} />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Response Fields</p>
              <div className="flex flex-wrap gap-1.5">
                {ep.responseFields.map((field) => (
                  <code
                    key={field}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                  >
                    {field}
                  </code>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Responses */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Error Responses</h3>
        <p className="text-sm text-slate-600 mb-4">All error responses return a JSON object with an <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded font-mono">error</code> field.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Status</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">401</code></td>
                <td className="py-2">API key missing from request</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">403</code></td>
                <td className="py-2">Invalid or revoked API key</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">404</code></td>
                <td className="py-2">Resource not found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
