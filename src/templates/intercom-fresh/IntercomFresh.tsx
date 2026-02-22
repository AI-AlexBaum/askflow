import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './intercom-fresh.module.css';
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

export default function IntercomFresh({ products, settings }: TemplateProps) {
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

  const handleItemClick = (fi: FlatItem) => {
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

  const isSearching = search.trim().length > 0;

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  const renderHome = () => (
    <>
      {/* Product Cards */}
      <div className={styles.productCardsSection}>
        <div className={styles.sectionLabel}>Browse by product</div>
        <div className={styles.productCards}>
          {products.map((product) => (
            <button
              key={product.id}
              className={styles.productCard}
              onClick={() => setView({ kind: 'product', product })}
            >
              <div className={styles.productCardIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className={styles.articleCount}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {countItemsArray(product.categories)} articles
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Articles */}
      <div className={styles.popularArticles}>
        <div className={styles.sectionLabel}>{settings.popular_label || 'Popular articles'}</div>
        <div className={styles.articleList}>
          {allItems.slice(0, 6).map((fi, idx) => (
            <button
              key={fi.item.id}
              className={styles.articleListItem}
              onClick={() => handleItemClick(fi)}
            >
              <div className={styles.articleNumber}>{idx + 1}</div>
              <div className={styles.articleListInfo}>
                <h4>{fi.item.question}</h4>
                <p>{fi.productName} &middot; {fi.categoryTitle}</p>
              </div>
              <div className={styles.articleListArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderProduct = (product: Product) => (
    <>
      <div className={styles.backRow}>
        <button className={styles.backButton} onClick={() => setView({ kind: 'home' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {settings.back_label || 'Back'}
        </button>
      </div>
      <div className={styles.viewHeader}>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
      </div>
      <div className={styles.articleList}>
        {product.categories.map((cat) => (
          <button
            key={cat.id}
            className={styles.articleListItem}
            onClick={() => goCategory(product, cat)}
          >
            <div className={styles.catIcon}>
              {cat.icon ? <DynamicIcon name={cat.icon} size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              )}
            </div>
            <div className={styles.articleListInfo}>
              <h4>{cat.title}</h4>
              <p>{cat.description || `${countItems(cat)} articles`}</p>
            </div>
            <div className={styles.articleListArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  const renderCategory = (product: Product, category: FAQCategory, parents: FAQCategory[]) => (
    <>
      <nav className={styles.breadcrumbs}>
        <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        <button className={styles.breadcrumbLink} onClick={() => setView({ kind: 'product', product })}>{product.name}</button>
        {parents.map((parent, i) => (
          <Fragment key={parent.id}>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <button className={styles.breadcrumbLink} onClick={() => goCategory(product, parent, parents.slice(0, i))}>
              {parent.title}
            </button>
          </Fragment>
        ))}
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        <span className={styles.breadcrumbCurrent}>{category.title}</span>
      </nav>
      <div className={styles.viewHeader}>
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
          <div className={styles.articleList}>
            {(category.items ?? []).map((item) => (
              <button
                key={item.id}
                className={styles.articleListItem}
                onClick={() => setView({ kind: 'item', product, category, parents, item })}
              >
                <div className={styles.articleNumber}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className={styles.articleListInfo}>
                  <h4>{item.question}</h4>
                </div>
                <div className={styles.articleListArrow}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderItem = (product: Product, category: FAQCategory, parents: FAQCategory[], item: FAQItem) => (
    <>
      <nav className={styles.breadcrumbs}>
        <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        <button className={styles.breadcrumbLink} onClick={() => setView({ kind: 'product', product })}>{product.name}</button>
        {parents.map((parent, i) => (
          <Fragment key={parent.id}>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <button className={styles.breadcrumbLink} onClick={() => goCategory(product, parent, parents.slice(0, i))}>
              {parent.title}
            </button>
          </Fragment>
        ))}
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        <button className={styles.breadcrumbLink} onClick={() => goCategory(product, category, parents)}>
          {category.title}
        </button>
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        <span className={styles.breadcrumbCurrent}>{item.question}</span>
      </nav>
      <article className={styles.articleDetail}>
        <h1>{item.question}</h1>
        <div className={styles.articleMeta}>
          {product.name} &middot; {category.title}
        </div>
        <div className={styles.markdownContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
        </div>
      </article>
    </>
  );

  const renderSearchResults = () => (
    <>
      <div className={styles.viewHeader}>
        <h2>Search Results</h2>
        <p>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;</p>
      </div>
      {searchResults.length > 0 ? (
        <div className={styles.articleList}>
          {searchResults.map((fi, idx) => (
            <button
              key={fi.item.id}
              className={styles.articleListItem}
              onClick={() => handleItemClick(fi)}
            >
              <div className={styles.articleNumber}>{idx + 1}</div>
              <div className={styles.articleListInfo}>
                <h4>{fi.item.question}</h4>
                <p>{fi.productName} &middot; {fi.categoryTitle}</p>
              </div>
              <div className={styles.articleListArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>{settings.no_results_text || 'No articles found. Try a different search term.'}</p>
      )}
    </>
  );

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
            {products.slice(0, 4).map((p) => (
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
          <div className={styles.heroGreeting}>Help Center</div>
          <h1>{settings.hero_title || 'Hi! How can we help?'}</h1>
          <div className={styles.searchWrapper}>
            <div className={styles.searchIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={settings.search_placeholder || 'Search for help articles...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        <div className={styles.mainContent}>
          {isSearching
            ? renderSearchResults()
            : view.kind === 'home'
              ? renderHome()
              : view.kind === 'product'
                ? renderProduct(view.product)
                : view.kind === 'category'
                  ? renderCategory(view.product, view.category, view.parents)
                  : renderItem(view.product, view.category, view.parents, view.item)}
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.contactCard}>
            <div className={styles.contactCardIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>Still need help?</h3>
            <p>Our support team is available 24/7 and typically responds within 2 hours.</p>
            <span className={styles.contactBtn}>
              Contact Us
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </div>
          <div className={styles.quickLinksCard}>
            <h4>Quick Links</h4>
            {products.map((p) => (
              <button
                key={p.id}
                className={styles.quickLink}
                onClick={() => setView({ kind: 'product', product: p })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                {p.name}
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</p>
        </div>
      </footer>
    </div>
  );
}
