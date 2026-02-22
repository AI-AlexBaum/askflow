import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, FolderTree, FileQuestion, Plus, TrendingUp, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import type { FAQCategory } from '../../types';

function countCategories(categories: FAQCategory[]): number {
  let count = 0;
  for (const cat of categories) {
    count += 1;
    if (cat.subcategories) {
      count += countCategories(cat.subcategories);
    }
  }
  return count;
}

function countItems(categories: FAQCategory[]): number {
  let count = 0;
  for (const cat of categories) {
    count += cat.items?.length ?? 0;
    if (cat.subcategories) {
      count += countItems(cat.subcategories);
    }
  }
  return count;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

function TrendLineSVG({ color }: { color: string }) {
  return (
    <svg
      className="absolute bottom-0 right-0 w-24 h-16 opacity-[0.07]"
      viewBox="0 0 96 64"
      fill="none"
    >
      <path
        d="M0 56 L16 48 L32 52 L48 36 L64 28 L80 16 L96 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FeedbackStat {
  id: string;
  question: string;
  total: number;
  helpful_count: number;
  unhelpful_count: number;
}

export default function AdminDashboard() {
  const { products } = useData();
  const { settings } = useSettings();
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStat[]>([]);

  useEffect(() => {
    fetch('/api/public/feedback/stats')
      .then(r => r.ok ? r.json() : [])
      .then(data => setFeedbackStats(data))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    let totalCategories = 0;
    let totalItems = 0;
    for (const product of products) {
      totalCategories += countCategories(product.categories);
      totalItems += countItems(product.categories);
    }
    return {
      products: products.length,
      categories: totalCategories,
      items: totalItems,
    };
  }, [products]);

  const statCards = [
    { label: 'Products', count: stats.products, icon: Package, color: settings.primary_color },
    { label: 'Categories', count: stats.categories, icon: FolderTree, color: settings.accent_color },
    { label: 'FAQ Items', count: stats.items, icon: FileQuestion, color: settings.primary_color },
  ];

  const quickActions = [
    { label: 'New Product', to: '/admin/products', icon: Package },
    { label: 'New Category', to: '/admin/categories', icon: FolderTree },
    { label: 'New FAQ Item', to: '/admin/faq-items', icon: FileQuestion },
  ];

  const greeting = getGreeting();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: settings.primary_color }}>
          {greeting}
        </h2>
        <p className="text-slate-500 font-normal mt-1.5 text-[15px]">
          Welcome to {settings.company_name} Admin. Manage your products, categories and FAQ items.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="relative overflow-hidden group cursor-default rounded-2xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Subtle gradient tint background */}
            <div
              className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.07] pointer-events-none transition-opacity duration-300"
              style={{ background: `linear-gradient(135deg, ${stat.color}, transparent)` }}
            />
            {/* Accent border on hover */}
            <div
              className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(90deg, ${stat.color}, transparent)` }}
            />
            {/* Decorative trend line */}
            <TrendLineSVG color={stat.color} />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-shadow duration-300"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors duration-300" />
              </div>
              <div className="text-3xl text-slate-800 font-semibold tracking-tight">
                <AnimatedCount value={stat.count} />
              </div>
              <div className="text-sm text-slate-500 font-normal mt-1">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: settings.primary_color }}>Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={action.to}
                className="flex items-center justify-center gap-3 text-center group text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all"
                style={{
                  background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.primary_color}cc)`,
                  boxShadow: `0 4px 14px ${settings.primary_color}30`,
                }}
              >
                <span className="inline-block transition-transform duration-200 group-hover:rotate-90">
                  <Plus className="w-4 h-4" />
                </span>
                {action.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: settings.primary_color }}>Products Overview</h3>
        <div className="overflow-hidden overflow-x-auto rounded-2xl" style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        }}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em]">Product</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em]">Categories</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em]">FAQ Items</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-normal">No products yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Create your first product to get started.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: settings.accent_color }}
                        />
                        <div>
                          <div className="text-slate-800 font-medium">{product.name}</div>
                          <div className="text-sm text-slate-500 font-normal truncate max-w-xs">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-normal">{countCategories(product.categories)}</td>
                    <td className="px-6 py-4 text-slate-800 font-normal">{countItems(product.categories)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: settings.primary_color }}>
          <MessageSquare className="w-5 h-5 inline-block mr-2 -mt-0.5" />
          Feedback
        </h3>
        <div className="overflow-hidden overflow-x-auto rounded-2xl" style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        }}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em]">Question</th>
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em] text-center">
                  <ThumbsUp className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />Helpful
                </th>
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em] text-center">
                  <ThumbsDown className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />Not Helpful
                </th>
                <th className="px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em] text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {feedbackStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-normal">No feedback yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Feedback will appear here once users rate FAQ items.</p>
                  </td>
                </tr>
              ) : (
                feedbackStats.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium truncate max-w-md">{item.question}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        {item.helpful_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                        {item.unhelpful_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-800 font-normal">{item.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
