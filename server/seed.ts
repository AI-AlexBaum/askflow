import db from './db.js';
import { hashPassword } from './auth.js';
import { v4 as uuid } from 'uuid';

// Seed data — two SaaS products with realistic FAQ content
const products = [
  { id: uuid(), name: 'Pulse', description: 'Real-time messaging and collaboration for modern teams.' },
  { id: uuid(), name: 'Launchpad', description: 'Ship faster with integrated project tracking and one-click deploys.' },
];

const categoriesAndItems: {
  productIndex: number;
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  icon: string;
  items?: { question: string; answer: string }[];
}[] = [];

// --- Pulse categories ---

// Channels & Messaging (root, with subcategories)
const channelsId = uuid();
const dmId = uuid();
const channelsSubId = uuid();
const integrationsId = uuid();
const billingId = uuid();

categoriesAndItems.push(
  {
    productIndex: 0, id: channelsId, parentId: null,
    title: 'Channels & Messaging', description: 'Send messages, create channels, and collaborate.', icon: 'MessageSquare',
  },
  {
    productIndex: 0, id: dmId, parentId: channelsId,
    title: 'Direct Messages', description: '', icon: '',
    items: [
      { question: 'How do I start a direct message?', answer: 'Click the + icon next to Direct Messages in the sidebar. Search for a teammate by name or email, then click their profile to open a conversation.' },
      { question: 'Can I create group direct messages?', answer: 'Yes! When starting a new DM, select multiple people to create a group conversation. Group DMs support up to 8 participants.' },
    ],
  },
  {
    productIndex: 0, id: channelsSubId, parentId: channelsId,
    title: 'Channels', description: '', icon: '',
    items: [
      { question: 'How do I create a new channel?', answer: 'Click the + next to Channels in the sidebar. Choose public or private, give it a name and description, then invite members. Public channels are discoverable by everyone.' },
      { question: "What's the difference between public and private channels?", answer: 'Public channels can be found and joined by any team member. Private channels are invite-only and hidden from non-members. Both support the same features.' },
    ],
  },
  {
    productIndex: 0, id: integrationsId, parentId: null,
    title: 'Integrations', description: 'Connect third-party apps and build custom workflows.', icon: 'Settings',
    items: [
      { question: 'How do I connect third-party apps?', answer: "Go to Settings \u2192 Integrations \u2192 Browse Apps. Find the app you want, click Install, and follow the authorization steps. Most integrations take under a minute to set up." },
      { question: 'Can I build custom integrations?', answer: 'Yes, Pulse offers a Webhooks API and a full REST API. Visit our developer docs at /developers to get started with custom bots, notifications, and workflow automations.' },
    ],
  },
  {
    productIndex: 0, id: billingId, parentId: null,
    title: 'Account & Billing', description: 'Manage your plan, team members, and data.', icon: 'CreditCard',
    items: [
      { question: 'How do I upgrade my plan?', answer: "Navigate to Settings \u2192 Billing \u2192 Change Plan. Compare available tiers, select the one that fits your team, and confirm. Upgrades take effect immediately with prorated billing." },
      { question: 'Can I add more team members?', answer: "Yes, go to Settings \u2192 Members \u2192 Invite. Enter their email addresses and choose a role (Member, Admin, or Guest). Each new seat is billed according to your current plan." },
      { question: 'How do I export my data?', answer: "Go to Settings \u2192 Account \u2192 Export Data. Choose the date range and content types (messages, files, or both). You\u2019ll receive a download link via email within a few minutes." },
    ],
  },
);

// --- Launchpad categories ---

const projectsId = uuid();
const deploymentsId = uuid();
const teamPermId = uuid();

categoriesAndItems.push(
  {
    productIndex: 1, id: projectsId, parentId: null,
    title: 'Projects', description: 'Create, import, and manage projects.', icon: 'FileText',
    items: [
      { question: 'How do I create a new project?', answer: 'Click New Project from the dashboard. Choose a template or start blank, set the project name and repository, then invite your team. Projects sync automatically with your Git provider.' },
      { question: 'Can I import from other tools?', answer: 'Yes, Launchpad supports imports from Jira, Asana, Trello, and Linear. Go to Settings \u2192 Import and select your source. Issues, labels, and assignments are mapped automatically.' },
      { question: 'How do sprint cycles work?', answer: 'Go to your project \u2192 Cycles. Create a new cycle with a start and end date, then drag issues into it. The burndown chart updates in real-time as work is completed.' },
    ],
  },
  {
    productIndex: 1, id: deploymentsId, parentId: null,
    title: 'Deployments', description: 'Deploy, preview, and roll back releases.', icon: 'Settings',
    items: [
      { question: 'How do I trigger a deployment?', answer: 'Push to your configured branch (usually main) or click Deploy Now on the project page. Launchpad builds your app, runs checks, and promotes to production automatically.' },
      { question: 'Can I roll back a deployment?', answer: 'Yes, open the Deployments tab and find the previous successful deploy. Click the three-dot menu and select Rollback. Traffic shifts back to the older version within seconds.' },
      { question: 'How do preview deployments work?', answer: 'Every pull request automatically gets a unique preview URL. Share it with your team for visual review. Preview deploys are torn down automatically when the PR is merged or closed.' },
    ],
  },
  {
    productIndex: 1, id: teamPermId, parentId: null,
    title: 'Team & Permissions', description: 'Manage roles and project access.', icon: 'Users',
    items: [
      { question: 'How do I manage team roles?', answer: 'Go to Settings \u2192 Team \u2192 Roles. Assign roles like Owner, Admin, Developer, or Viewer to control access. Custom roles can be created for fine-grained permissions.' },
      { question: 'Can I restrict access to specific projects?', answer: 'Yes, each project has its own access settings. Go to the project settings \u2192 Members to add or remove people. You can also set environment-level restrictions for staging and production.' },
    ],
  },
);

// Default settings
const defaultSettings = [
  ['company_name', 'AskFlow'],
  ['tagline', 'Your knowledge, instantly accessible'],
  ['primary_color', '#2563eb'],
  ['accent_color', '#f97316'],
  ['logo_url', ''],
  ['template', 'stripe-minimal'],
];

// Run seed
console.log('Seeding database...');

// Clear existing data
db.exec('DELETE FROM faq_items');
db.exec('DELETE FROM categories');
db.exec('DELETE FROM products');
db.exec('DELETE FROM users');
db.exec('DELETE FROM settings');

// Create default admin
const adminId = uuid();
const adminHash = hashPassword('admin123');
db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
  adminId, 'admin@example.com', adminHash, 'Admin'
);
console.log('  Created admin user: admin@example.com / admin123');

// Insert products
const insertProduct = db.prepare('INSERT INTO products (id, name, description, sort_order) VALUES (?, ?, ?, ?)');
products.forEach((p, i) => insertProduct.run(p.id, p.name, p.description, i));
console.log(`  Inserted ${products.length} products`);

// Insert categories and items
const insertCategory = db.prepare('INSERT INTO categories (id, product_id, parent_id, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertItem = db.prepare('INSERT INTO faq_items (id, category_id, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)');

let catCount = 0;
let itemCount = 0;

categoriesAndItems.forEach((cat, i) => {
  const productId = products[cat.productIndex].id;
  insertCategory.run(cat.id, productId, cat.parentId, cat.title, cat.description, cat.icon, i);
  catCount++;

  if (cat.items) {
    cat.items.forEach((item, j) => {
      insertItem.run(uuid(), cat.id, item.question, item.answer, j);
      itemCount++;
    });
  }
});

console.log(`  Inserted ${catCount} categories`);
console.log(`  Inserted ${itemCount} FAQ items`);

// Insert default settings
const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));
console.log(`  Inserted ${defaultSettings.length} settings`);

console.log('Seed complete!');
