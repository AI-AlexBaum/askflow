import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './startup-bold.module.css';
import DynamicIcon from '../IconMap';

interface FlatItem {
  item: FAQItem;
  categoryTitle: string;
  productName: string;
  productId: string;
}

function flattenItems(products: Product[]): FlatItem[] {
  const result: FlatItem[] = [];
  const walk = (cats: FAQCategory[], productName: string, productId: string) => {
    for (const cat of cats) {
      if (cat.items) {
        for (const item of cat.items) {
          result.push({ item, categoryTitle: cat.title, productName, productId });
        }
      }
      if (cat.subcategories) {
        walk(cat.subcategories, productName, productId);
      }
    }
  };
  for (const p of products) {
    walk(p.categories, p.name, p.id);
  }
  return result;
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
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] }
  | { kind: 'item'; product: Product; category: FAQCategory; parents: FAQCategory[]; item: FAQItem };

export default function StartupBold({ products, settings }: TemplateProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? '');
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

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? products[0];

  const currentItems = useMemo(() => {
    if (!selectedProduct) return [];
    return allItems.filter((fi) => fi.productId === selectedProduct.id);
  }, [allItems, selectedProduct]);

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  return (
    <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.logo} onClick={goHome} type="button">
            {settings.header_display !== 'name' && settings.logo_url && (
              <img src={settings.logo_url} alt="" className={styles.logoImg} />
            )}
            {settings.header_display !== 'logo' && settings.company_name}
            <span className={styles.logoDot} />
          </button>
          <nav>
            <ul className={styles.nav}>
              <li><button className={styles.navLink} onClick={goHome} type="button">Home</button></li>
              <li><button className={`${styles.navLink} ${styles.navBtn}`} onClick={goHome} type="button">Get Help</button></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          {view.kind === 'home' && (
            <>
              <h1 className={styles.heroTitle}>
                {settings.hero_title || <>Find answers <span className={styles.highlight}>fast</span></>}
              </h1>
              <p className={styles.heroSubtitle}>{settings.tagline}</p>
            </>
          )}

          {view.kind === 'category' && (
            <>
              <nav className={styles.breadcrumbs}>
                <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={goHome}>{view.product.name}</button>
                {view.parents.map((parent, i) => (
                  <Fragment key={parent.id}>
                    <span className={styles.breadcrumbSep}>&rsaquo;</span>
                    <button className={styles.breadcrumbLink} onClick={() => goCategory(view.product, parent, view.parents.slice(0, i))}>
                      {parent.title}
                    </button>
                  </Fragment>
                ))}
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <span className={styles.breadcrumbCurrent}>{view.category.title}</span>
              </nav>
              <h1 className={styles.heroTitle}>{view.category.title}</h1>
              {view.category.description && <p className={styles.heroSubtitle}>{view.category.description}</p>}
            </>
          )}

          {view.kind === 'item' && (
            <>
              <nav className={styles.breadcrumbs}>
                <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={goHome}>{view.product.name}</button>
                {view.parents.map((parent, i) => (
                  <Fragment key={parent.id}>
                    <span className={styles.breadcrumbSep}>&rsaquo;</span>
                    <button className={styles.breadcrumbLink} onClick={() => goCategory(view.product, parent, view.parents.slice(0, i))}>
                      {parent.title}
                    </button>
                  </Fragment>
                ))}
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={() => goCategory(view.product, view.category, view.parents)}>
                  {view.category.title}
                </button>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <span className={styles.breadcrumbCurrent}>{view.item.question}</span>
              </nav>
              <h1 className={styles.heroTitle}>{view.item.question}</h1>
            </>
          )}

          {/* Search */}
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={settings.search_placeholder || 'Type your question here...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className={styles.container}>
        {/* Search Results */}
        {search.trim() ? (
          <section className={styles.tabsSection}>
            <h2 className={styles.resultsTitle}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </h2>
            {searchResults.length > 0 ? (
              <div className={styles.faqGrid}>
                {searchResults.map((fi) => {
                  const srProduct = products.find((p) => p.id === fi.productId);
                  return (
                  <button
                    key={fi.item.id}
                    className={styles.faqCard}
                    onClick={() => { if (srProduct) setView({ kind: 'item', product: srProduct, category: { id: '', title: fi.categoryTitle, subcategories: [], items: [] }, parents: [], item: fi.item }); setSearch(''); }}
                    type="button"
                  >
                    <span className={styles.faqCardBadge}>{fi.categoryTitle}</span>
                    <h4 className={styles.faqCardTitle}>{fi.item.question}</h4>
                    <p className={styles.faqCardText}>{fi.item.answer.slice(0, 120)}{fi.item.answer.length > 120 ? '...' : ''}</p>
                    <span className={styles.readMore}>Read more &rarr;</span>
                  </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>{settings.no_results_text || 'No articles found. Try a different search term.'}</p>
              </div>
            )}
          </section>
        ) : view.kind === 'home' ? (
          <section className={styles.tabsSection}>
            {/* Product Tabs */}
            {products.length > 1 && (
              <div className={styles.tabBar}>
                {products.map((product) => (
                  <button
                    key={product.id}
                    className={`${styles.tabBtn} ${product.id === selectedProductId ? styles.tabBtnActive : ''}`}
                    onClick={() => setSelectedProductId(product.id)}
                    type="button"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}

            {/* Category Badges */}
            {selectedProduct && selectedProduct.categories.length > 0 && (
              <div className={styles.categoriesHeader}>
                {selectedProduct.categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={styles.categoryBadge}
                    onClick={() => goCategory(selectedProduct, cat)}
                    type="button"
                  >
                    {cat.icon && <span className={styles.categoryBadgeIcon}><DynamicIcon name={cat.icon} size={16} className={styles.catIcon} /></span>}
                    {cat.title}
                  </button>
                ))}
              </div>
            )}

            {/* FAQ Cards */}
            {currentItems.length > 0 && (
              <div className={styles.faqGrid}>
                {currentItems.map((fi) => {
                  const fiProduct = products.find((p) => p.id === fi.productId);
                  return (
                  <button
                    key={fi.item.id}
                    className={styles.faqCard}
                    onClick={() => { if (fiProduct) setView({ kind: 'item', product: fiProduct, category: { id: '', title: fi.categoryTitle, subcategories: [], items: [] }, parents: [], item: fi.item }); }}
                    type="button"
                  >
                    <span className={styles.faqCardBadge}>{fi.categoryTitle}</span>
                    <h4 className={styles.faqCardTitle}>{fi.item.question}</h4>
                    <p className={styles.faqCardText}>{fi.item.answer.slice(0, 120)}{fi.item.answer.length > 120 ? '...' : ''}</p>
                    <span className={styles.readMore}>Read more &rarr;</span>
                  </button>
                  );
                })}
              </div>
            )}

            {/* Actions Row */}
            <div className={styles.actionsRow}>
              <button className={styles.btnGreen} type="button">
                View all {selectedProduct?.name} articles
              </button>
              <button className={styles.btnOutline} type="button">
                Contact support
              </button>
            </div>
          </section>
        ) : view.kind === 'category' ? (
          <section className={styles.tabsSection}>
            {(view.category.subcategories ?? []).length > 0 && (
              <>
                <div className={styles.sectionLabel}>Subcategories</div>
                <div className={styles.subcategoryList}>
                  {view.category.subcategories!.map((sub) => (
                    <button key={sub.id} className={styles.subcategoryItem}
                      onClick={() => goCategory(view.product, sub, [...view.parents, view.category])}
                      type="button">
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
            {/* Category items */}
            {(view.category.items ?? []).length > 0 && (
              <>
                {(view.category.subcategories ?? []).length > 0 && <div className={styles.sectionLabel}>Articles</div>}
                <div className={styles.faqGrid}>
                  {(view.category.items ?? []).map((item) => (
                    <button
                      key={item.id}
                      className={styles.faqCard}
                      onClick={() => setView({ kind: 'item', product: view.product, category: view.category, parents: view.parents, item })}
                      type="button"
                    >
                      <span className={styles.faqCardBadge}>{view.category.title}</span>
                      <h4 className={styles.faqCardTitle}>{item.question}</h4>
                      <p className={styles.faqCardText}>{item.answer.slice(0, 120)}{item.answer.length > 120 ? '...' : ''}</p>
                      <span className={styles.readMore}>Read more &rarr;</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : view.kind === 'item' ? (
          <section className={styles.tabsSection}>
            <div className={styles.articleCard}>
              <span className={styles.faqCardBadge}>{view.category.title}</span>
              <div className={styles.articleBody}><div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{view.item.answer}</ReactMarkdown></div></div>
            </div>
          </section>
        ) : null}
      </main>

      {/* CTA */}
      {view.kind === 'home' && !search.trim() && (
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.ctaTitle}>Can't find what you need?</h2>
            <p className={styles.ctaText}>Our support team is here to help you get the most out of {settings.company_name}.</p>
            <button className={styles.btnGreen} type="button">Contact Support</button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              {settings.company_name}
              <span className={styles.footerDot} />
            </div>
            <ul className={styles.footerLinks}>
              <li><span>Privacy</span></li>
              <li><span>Terms</span></li>
              <li><span>Status</span></li>
              <li><span>Blog</span></li>
            </ul>
            <span className={styles.footerCopy}>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
