import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './glassmorphism-premium.module.css';
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
  | { kind: 'product'; product: Product }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] }
  | { kind: 'item'; product: Product; category: FAQCategory; parents: FAQCategory[]; item: FAQItem };

export default function GlassmorphismPremium({ products, settings }: TemplateProps) {
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

  const popularItems = useMemo(() => allItems.slice(0, 6), [allItems]);

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  return (
    <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Decorative orbs */}
      <div className={styles.orbTopRight} />
      <div className={styles.orbBottomLeft} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.logo} onClick={goHome} type="button">
            {settings.header_display !== 'name' && (settings.logo_url ? (
              <img src={settings.logo_url} alt="" className={styles.logoImg} />
            ) : (
              <span className={styles.logoIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 9a3 3 0 115.12 2.13c-.67.44-1.12 1.2-1.12 2.12v.5" />
                  <circle cx="12" cy="17" r="0.5" />
                </svg>
              </span>
            ))}
            {settings.header_display !== 'logo' && settings.company_name}
          </button>
          <nav>
            <ul className={styles.navLinks}>
              <li><button className={styles.navLink} onClick={goHome} type="button">Home</button></li>
              <li><button className={`${styles.navLink} ${styles.navCta}`} onClick={goHome} type="button">Contact Support</button></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          {view.kind === 'home' && (
            <>
              <h1 className={styles.heroTitle}>{settings.hero_title || 'How can we help?'}</h1>
              <p className={styles.heroSubtitle}>{settings.tagline}</p>
            </>
          )}

          {view.kind === 'product' && (
            <>
              <nav className={styles.breadcrumbs}>
                <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <span className={styles.breadcrumbCurrent}>{view.product.name}</span>
              </nav>
              <h1 className={styles.heroTitle}>{view.product.name}</h1>
              <p className={styles.heroSubtitle}>{view.product.description}</p>
            </>
          )}

          {view.kind === 'category' && (
            <>
              <nav className={styles.breadcrumbs}>
                <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={() => setView({ kind: 'product', product: view.product })}>{view.product.name}</button>
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
                <button className={styles.breadcrumbLink} onClick={() => setView({ kind: 'product', product: view.product })}>{view.product.name}</button>
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
              placeholder={settings.search_placeholder || 'Search for articles, guides, and more...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className={styles.container}>
        {/* Search Results */}
        {search.trim() ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
            </h2>
            {searchResults.length > 0 ? (
              <div className={styles.faqGrid}>
                {searchResults.map((fi) => {
                  const srProduct = products.find((p) => p.id === fi.productId);
                  return (
                  <button
                    key={fi.item.id}
                    className={`${styles.faqCard} ${styles.glass}`}
                    onClick={() => { if (srProduct) setView({ kind: 'item', product: srProduct, category: { id: '', title: fi.categoryTitle, subcategories: [], items: [] }, parents: [], item: fi.item }); setSearch(''); }}
                    type="button"
                  >
                    <span className={styles.faqBadge}>{fi.categoryTitle}</span>
                    <h4 className={styles.faqQuestion}>{fi.item.question}</h4>
                    <p className={styles.faqAnswer}>{fi.item.answer.slice(0, 120)}{fi.item.answer.length > 120 ? '...' : ''}</p>
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
          <>
            {/* Products */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Choose your product</h2>
              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <div key={product.id} className={`${styles.productCard} ${styles.glass}`}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDesc}>{product.description}</p>
                    <ul className={styles.categoryLinks}>
                      {product.categories.map((cat) => (
                        <li key={cat.id}>
                          <button
                            className={styles.categoryLink}
                            onClick={() => goCategory(product, cat)}
                            type="button"
                          >
                            <span className={styles.catIcon}>
                              {cat.icon ? (
                                <DynamicIcon name={cat.icon} size={16} />
                              ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                                </svg>
                              )}
                            </span>
                            <span className={styles.catText}>
                              <span className={styles.catName}>{cat.title}</span>
                              {cat.description && <span className={styles.catDesc}>{cat.description}</span>}
                            </span>
                            <span className={styles.arrow}>&rarr;</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Popular Questions */}
            {popularItems.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{settings.popular_label || 'Popular Questions'}</h2>
                <div className={styles.faqGrid}>
                  {popularItems.map((fi) => (
                    <button
                      key={fi.item.id}
                      className={`${styles.faqCard} ${styles.glass}`}
                      onClick={() => {
                        const prd = products.find((p) => p.id === fi.productId);
                        if (prd) setView({ kind: 'item', product: prd, category: { id: '', title: fi.categoryTitle, subcategories: [], items: [] }, parents: [], item: fi.item });
                      }}
                      type="button"
                    >
                      <span className={styles.faqBadge}>{fi.categoryTitle}</span>
                      <h4 className={styles.faqQuestion}>{fi.item.question}</h4>
                      <p className={styles.faqAnswer}>{fi.item.answer.slice(0, 120)}{fi.item.answer.length > 120 ? '...' : ''}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <section className={styles.section}>
              <div className={`${styles.ctaCard} ${styles.glass}`}>
                <h2 className={styles.ctaTitle}>Still have questions?</h2>
                <p className={styles.ctaText}>Our support team is ready to help. Get in touch and we will respond as soon as possible.</p>
                <button className={styles.ctaBtn} type="button">Contact Support</button>
              </div>
            </section>
          </>
        ) : view.kind === 'product' ? (
          <section className={styles.section}>
            <div className={styles.productsGrid}>
              {view.product.categories.map((cat) => (
                <div key={cat.id} className={`${styles.productCard} ${styles.glass}`}>
                  <h3 className={styles.productName}>{cat.title}</h3>
                  {cat.description && <p className={styles.productDesc}>{cat.description}</p>}
                  {cat.items && cat.items.length > 0 && (
                    <ul className={styles.categoryLinks}>
                      {cat.items.map((item) => (
                        <li key={item.id}>
                          <button
                            className={styles.categoryLink}
                            onClick={() => setView({ kind: 'item', product: view.product, category: cat, parents: [], item })}
                            type="button"
                          >
                            <span className={styles.catText}>
                              <span className={styles.catName}>{item.question}</span>
                            </span>
                            <span className={styles.arrow}>&rarr;</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ul className={styles.categoryLinks}>
                      {cat.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <button
                            className={styles.categoryLink}
                            onClick={() => goCategory(view.product, sub, [cat])}
                            type="button"
                          >
                            <span className={styles.catIcon}>
                              {sub.icon ? (
                                <DynamicIcon name={sub.icon} size={16} />
                              ) : (
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                                </svg>
                              )}
                            </span>
                            <span className={styles.catText}>
                              <span className={styles.catName}>{sub.title}</span>
                              {sub.description && <span className={styles.catDesc}>{sub.description}</span>}
                            </span>
                            <span className={styles.arrow}>&rarr;</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : view.kind === 'category' ? (
          <section className={styles.section}>
            {(view.category.subcategories ?? []).length > 0 && (
              <>
                <div className={styles.sectionLabel}>Subcategories</div>
                <div className={styles.subcategoryList}>
                  {view.category.subcategories!.map((sub) => (
                    <button key={sub.id} className={`${styles.subcategoryItem} ${styles.glass}`}
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
            {(view.category.items ?? []).length > 0 && (
              <>
                {(view.category.subcategories ?? []).length > 0 && <div className={styles.sectionLabel}>Articles</div>}
                <div className={styles.faqGrid}>
                  {(view.category.items ?? []).map((item) => (
                    <button
                      key={item.id}
                      className={`${styles.faqCard} ${styles.glass}`}
                      onClick={() => setView({ kind: 'item', product: view.product, category: view.category, parents: view.parents, item })}
                      type="button"
                    >
                      <span className={styles.faqBadge}>{view.category.title}</span>
                      <h4 className={styles.faqQuestion}>{item.question}</h4>
                      <p className={styles.faqAnswer}>{item.answer.slice(0, 120)}{item.answer.length > 120 ? '...' : ''}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        ) : view.kind === 'item' ? (
          <section className={styles.section}>
            <div className={`${styles.articleCard} ${styles.glass}`}>
              <span className={styles.faqBadge}>{view.category.title}</span>
              <div className={styles.articleBody}><div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{view.item.answer}</ReactMarkdown></div></div>
            </div>
          </section>
        ) : null}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <div className={styles.footerLeft}>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</div>
            <ul className={styles.footerLinks}>
              <li><span>Privacy Policy</span></li>
              <li><span>Terms of Service</span></li>
              <li><span>Status</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
