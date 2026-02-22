import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './banking-corporate.module.css';
import DynamicIcon from '../IconMap';

interface FlatItem {
  item: FAQItem;
  productName: string;
  categoryTitle: string;
}

function flattenItems(products: Product[]): FlatItem[] {
  const results: FlatItem[] = [];
  const walk = (cats: FAQCategory[], productName: string) => {
    for (const cat of cats) {
      if (cat.items) {
        for (const item of cat.items) {
          results.push({ item, productName, categoryTitle: cat.title });
        }
      }
      if (cat.subcategories) walk(cat.subcategories, productName);
    }
  };
  for (const p of products) walk(p.categories, p.name);
  return results;
}

function countItemsArray(categories: FAQCategory[]): number {
  let count = 0;
  for (const cat of categories) {
    count += cat.items?.length ?? 0;
    if (cat.subcategories) count += countItemsArray(cat.subcategories);
  }
  return count;
}

function countItems(cat: FAQCategory): number {
  let count = (cat.items ?? []).length;
  for (const sub of cat.subcategories ?? []) {
    count += countItems(sub);
  }
  return count;
}

type View =
  | { kind: 'home' }
  | { kind: 'product'; product: Product }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] }
  | { kind: 'item'; product: Product; category: FAQCategory; parents: FAQCategory[]; item: FAQItem };

export default function BankingCorporate({ products, settings }: TemplateProps) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [search, setSearch] = useState('');

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

  const handleSearchItemClick = (fi: FlatItem) => {
    const product = products.find((p) => p.name === fi.productName);
    if (!product) return;
    const findCat = (cats: FAQCategory[]): FAQCategory | undefined => {
      for (const c of cats) {
        if (c.title === fi.categoryTitle && c.items?.some((i) => i.id === fi.item.id)) return c;
        if (c.subcategories) {
          const found = findCat(c.subcategories);
          if (found) return found;
        }
      }
      return undefined;
    };
    const category = findCat(product.categories);
    if (category) {
      setView({ kind: 'item', product, category, parents: [], item: fi.item });
      setSearch('');
    }
  };

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  const renderBreadcrumb = () => {
    if (view.kind === 'home') return null;
    const crumbs: { label: string; onClick: () => void }[] = [
      { label: 'Home', onClick: goHome },
    ];
    if (view.kind === 'product' || view.kind === 'category' || view.kind === 'item') {
      crumbs.push({
        label: view.product.name,
        onClick: () => setView({ kind: 'product', product: view.product }),
      });
    }
    if (view.kind === 'category' || view.kind === 'item') {
      const parents = view.parents;
      parents.forEach((parent, i) => {
        crumbs.push({
          label: parent.title,
          onClick: () => goCategory(view.product, parent, parents.slice(0, i)),
        });
      });
      crumbs.push({
        label: view.category.title,
        onClick: () => goCategory(view.product, view.category, view.parents),
      });
    }
    if (view.kind === 'item') {
      crumbs.push({ label: view.item.question, onClick: () => {} });
    }
    return (
      <nav className={styles.breadcrumb}>
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className={styles.breadcrumbSep}>/</span>}
            {i < crumbs.length - 1 ? (
              <button className={styles.breadcrumbLink} onClick={c.onClick}>
                {c.label}
              </button>
            ) : (
              <span className={styles.breadcrumbCurrent}>{c.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
    );
  };

  const renderHome = () => (
    <>
      <section className={styles.productsSection}>
        <div className={styles.sectionHeader}>
          <h2>Browse by Product</h2>
          <p>Find answers organized by product and category</p>
        </div>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => setView({ kind: 'product', product })}
            >
              <div className={styles.productIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <ul className={styles.categoryList}>
                {product.categories.slice(0, 3).map((cat) => (
                  <li key={cat.id}>
                    {cat.icon ? <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} /> : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    )}
                    {cat.title}
                  </li>
                ))}
              </ul>
              <span className={styles.exploreLink}>
                Explore
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.popularSection}>
        <div className={styles.popularInner}>
          <div className={styles.sectionHeader}>
            <h2>{settings.popular_label || 'Popular Articles'}</h2>
            <p>Frequently read articles across all products</p>
          </div>
          <div className={styles.articlesGrid}>
            {allItems.slice(0, 6).map((fi, idx) => (
              <button
                key={fi.item.id}
                className={styles.articleItem}
                onClick={() => handleSearchItemClick(fi)}
              >
                <div className={styles.articleBadge}>
                  {fi.productName.substring(0, 2)}
                </div>
                <div className={styles.articleContent}>
                  <h4>{fi.item.question}</h4>
                  <p>{fi.productName} &middot; {fi.categoryTitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderProduct = (product: Product) => (
    <section className={styles.productsSection}>
      <div className={styles.sectionHeader}>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
      </div>
      <div className={styles.productGrid}>
        {product.categories.map((cat) => (
          <div
            key={cat.id}
            className={styles.productCard}
            onClick={() => goCategory(product, cat)}
          >
            <div className={styles.productIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>{cat.title}</h3>
            {cat.description && <p>{cat.description}</p>}
            <span className={styles.categoryCount}>
              {countItems(cat)} article{countItems(cat) !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </section>
  );

  const renderCategory = (product: Product, category: FAQCategory, parents: FAQCategory[]) => (
    <section className={styles.productsSection}>
      <div className={styles.sectionHeader}>
        <h2>{category.title}</h2>
        {category.description && <p>{category.description}</p>}
      </div>

      {(category.subcategories ?? []).length > 0 && (
        <>
          <div className={styles.sectionLabel}>Subcategories</div>
          <div className={styles.subcategoryList}>
            {category.subcategories!.map((sub) => (
              <button key={sub.id} className={styles.subcategoryItem}
                onClick={() => goCategory(product, sub, [...parents, category])}>
                <span className={styles.subcategoryLeft}>
                  {sub.icon ? <DynamicIcon name={sub.icon} size={18} className={styles.catIcon} /> : (
                    <svg className={styles.folderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  )}
                  {sub.title}
                </span>
                <span className={styles.subcategoryRight}>
                  <span className={styles.subcategoryCount}>{countItems(sub)} items</span>
                  <span className={styles.catArrow}>&rsaquo;</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {(category.items ?? []).length > 0 && (
        <>
          {(category.subcategories ?? []).length > 0 && <div className={styles.sectionLabel}>Articles</div>}
          <div className={styles.articlesGrid}>
            {(category.items ?? []).map((item) => (
              <button
                key={item.id}
                className={styles.articleItem}
                onClick={() => setView({ kind: 'item', product, category, parents, item })}
              >
                <div className={styles.articleBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className={styles.articleContent}>
                  <h4>{item.question}</h4>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );

  const renderItem = (product: Product, category: FAQCategory, item: FAQItem) => (
    <section className={styles.articleDetail}>
      <h1>{item.question}</h1>
      <div className={styles.articleMeta}>
        {product.name} &middot; {category.title}
      </div>
      <div className={styles.markdownContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
      </div>
    </section>
  );

  const isSearching = search.trim().length > 0;

  return (
    <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.logo} onClick={() => { setView({ kind: 'home' }); setSearch(''); }}>
            {settings.header_display !== 'name' && settings.logo_url && (
              <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />
            )}
            {settings.header_display !== 'logo' && settings.company_name}
          </button>
          <nav className={styles.nav}>
            {products.slice(0, 3).map((p) => (
              <button key={p.id} className={styles.navLink} onClick={() => setView({ kind: 'product', product: p })}>
                {p.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>{settings.hero_title || 'How can we help?'}</h1>
          <p>Search our help center or browse by product.</p>
          <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={settings.search_placeholder || 'Search for articles, guides, and more...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.statsBar}>
            <div className={styles.statPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {allItems.length}+ Articles
            </div>
            <div className={styles.statPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              {products.length} Products
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      {!isSearching && renderBreadcrumb()}

      {/* Body */}
      <main className={styles.body}>
        {isSearching ? (
          <section className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h2>Search Results</h2>
              <p>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
            </div>
            {searchResults.length > 0 ? (
              <div className={styles.articlesGrid}>
                {searchResults.map((fi) => (
                  <button
                    key={fi.item.id}
                    className={styles.articleItem}
                    onClick={() => handleSearchItemClick(fi)}
                  >
                    <div className={styles.articleBadge}>
                      {fi.productName.substring(0, 2)}
                    </div>
                    <div className={styles.articleContent}>
                      <h4>{fi.item.question}</h4>
                      <p>{fi.productName} &middot; {fi.categoryTitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>{settings.no_results_text || 'No articles found. Try a different search term.'}</p>
            )}
          </section>
        ) : view.kind === 'home' ? (
          renderHome()
        ) : view.kind === 'product' ? (
          renderProduct(view.product)
        ) : view.kind === 'category' ? (
          renderCategory(view.product, view.category, view.parents)
        ) : (
          renderItem(view.product, view.category, view.item)
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>{settings.company_name}</span>
            <p>{settings.tagline}</p>
          </div>
          <div className={styles.footerBottom}>
            <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
