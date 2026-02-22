import { useState, useMemo, useCallback, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import s from './notion-clean.module.css';
import DynamicIcon from '../IconMap';

/* ── helpers ── */

interface FlatItem {
  product: Product;
  category: FAQCategory;
  subcategory?: FAQCategory;
  item: FAQItem;
}

function flattenAll(products: Product[]): FlatItem[] {
  const out: FlatItem[] = [];
  for (const product of products) {
    for (const cat of product.categories) {
      if (cat.items) {
        for (const item of cat.items) {
          out.push({ product, category: cat, item });
        }
      }
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          if (sub.items) {
            for (const item of sub.items) {
              out.push({ product, category: cat, subcategory: sub, item });
            }
          }
        }
      }
    }
  }
  return out;
}

function countItems(cat: FAQCategory): number {
  let count = (cat.items ?? []).length;
  for (const sub of cat.subcategories ?? []) {
    count += countItems(sub);
  }
  return count;
}

/* ── navigation state ── */
type View =
  | { kind: 'home' }
  | { kind: 'product'; product: Product }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] };

export default function NotionClean({ products, settings }: TemplateProps) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    () => new Set(products.map((p) => p.id)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flat = useMemo(() => flattenAll(products), [products]);

  const results = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return flat.filter(
      (f) =>
        f.item.question.toLowerCase().includes(q) ||
        f.item.answer.toLowerCase().includes(q),
    );
  }, [search, flat]);

  const toggleFaq = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleProductSidebar = useCallback((id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  const isSearching = search.trim().length > 0;

  /* ── active category for sidebar highlight ── */
  const activeCategoryId =
    view.kind === 'category' ? view.category.id : null;

  /* ── breadcrumb ── */
  const renderBreadcrumb = () => {
    const parts: { label: string; onClick?: () => void }[] = [
      { label: settings.company_name, onClick: goHome },
    ];

    if (view.kind === 'home') {
      parts.push({ label: 'All Products' });
    } else if (view.kind === 'product') {
      parts.push({ label: 'All Products', onClick: () => setView({ kind: 'home' }) });
      parts.push({ label: view.product.name });
    } else if (view.kind === 'category') {
      parts.push({ label: 'All Products', onClick: () => setView({ kind: 'home' }) });
      parts.push({
        label: view.product.name,
        onClick: () => setView({ kind: 'product', product: view.product }),
      });
      view.parents.forEach((parent, i) => {
        parts.push({
          label: parent.title,
          onClick: () => goCategory(view.product, parent, view.parents.slice(0, i)),
        });
      });
      parts.push({ label: view.category.title });
    }

    return (
      <div className={s.breadcrumb}>
        {parts.map((p, i) => (
          <Fragment key={i}>
            {i > 0 && <span className={s.breadcrumbSep}>/</span>}
            {p.onClick ? (
              <button className={s.breadcrumbLink} onClick={p.onClick}>
                {p.label}
              </button>
            ) : (
              <span className={s.breadcrumbCurrent}>{p.label}</span>
            )}
          </Fragment>
        ))}
      </div>
    );
  };

  /* ── render FAQ item ── */
  const renderFaqItem = (item: FAQItem) => {
    const isOpen = openIds.has(item.id);
    return (
      <li key={item.id} className={s.faqItem}>
        <div className={s.faqItemHeader} onClick={() => toggleFaq(item.id)}>
          <span className={`${s.faqItemToggle} ${isOpen ? s.faqItemToggleOpen : ''}`}>
            &#9654;
          </span>
          <span className={s.faqItemQuestion}>{item.question}</span>
        </div>
        {isOpen && (
          <div className={s.faqItemAnswer}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown></div></div>
        )}
      </li>
    );
  };

  /* ── render category ── */
  const renderCategory = (cat: FAQCategory, parentProduct?: Product, parentParents?: FAQCategory[]) => (
    <div key={cat.id} className={s.contentCategory}>
      <div className={s.contentCategoryHeader}>
        {cat.icon && <span className={s.contentCategoryEmoji}><DynamicIcon name={cat.icon} size={16} className={s.catIcon} /></span>}
        <h3 className={s.contentCategoryTitle}>{cat.title}</h3>
        {cat.description && (
          <span className={s.contentCategoryDesc}>{cat.description}</span>
        )}
      </div>

      {(cat.subcategories ?? []).length > 0 && (
        <>
          <div className={s.sectionLabel}>Subcategories</div>
          <div className={s.subcategoryList}>
            {cat.subcategories!.map((sub) => (
              <button key={sub.id} className={s.subcategoryItem}
                onClick={() => {
                  if (parentProduct) {
                    goCategory(parentProduct, sub, [...(parentParents ?? []), cat]);
                  }
                }}>
                <span className={s.subcategoryLeft}>
                  {sub.icon ? <DynamicIcon name={sub.icon} size={18} className={s.catIcon} /> : (
                    <svg className={s.folderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  )}
                  {sub.title}
                </span>
                <span className={s.subcategoryRight}>
                  <span className={s.subcategoryCount}>{countItems(sub)} items</span>
                  <span className={s.catArrow}>&rsaquo;</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {(cat.items ?? []).length > 0 && (
        <>
          {(cat.subcategories ?? []).length > 0 && <div className={s.sectionLabel}>Articles</div>}
          <ul className={s.faqList}>
            {(cat.items ?? []).map(renderFaqItem)}
          </ul>
        </>
      )}
    </div>
  );

  /* ── main content ── */
  const renderContent = () => {
    if (isSearching) {
      return (
        <>
          <h1 className={s.pageTitle}>Search Results</h1>
          <p className={s.pageSubtitle}>
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
          {results.length === 0 ? (
            <div className={s.noResults}>{settings.no_results_text || 'No articles found. Try a different search term.'}</div>
          ) : (
            results.map((r) => (
              <div
                key={r.item.id}
                className={s.searchResultItem}
                onClick={() => {
                  setSearch('');
                  goCategory(r.product, r.category);
                  setOpenIds((prev) => new Set(prev).add(r.item.id));
                }}
              >
                <div className={s.searchResultMeta}>
                  {r.product.name} / {r.category.title}
                </div>
                <div className={s.searchResultQuestion}>{r.item.question}</div>
                <div className={s.searchResultAnswer}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.item.answer}</ReactMarkdown></div></div>
              </div>
            ))
          )}
        </>
      );
    }

    if (view.kind === 'category') {
      return (
        <>
          <div className={s.contentProductHeader}>
            <span className={s.contentProductEmoji}>
              {view.product.name.charAt(0)}
            </span>
            <h2 className={s.contentProductTitle}>{view.category.title}</h2>
          </div>
          {view.category.description && (
            <p className={s.contentProductDesc}>{view.category.description}</p>
          )}
          {renderCategory(view.category, view.product, view.parents)}
        </>
      );
    }

    if (view.kind === 'product') {
      return (
        <>
          <div className={s.contentProductHeader}>
            <span className={s.contentProductEmoji}>
              {view.product.name.charAt(0)}
            </span>
            <h2 className={s.contentProductTitle}>{view.product.name}</h2>
          </div>
          <p className={s.contentProductDesc}>{view.product.description}</p>
          {view.product.categories.map((cat) => renderCategory(cat, view.product, []))}
        </>
      );
    }

    /* home */
    return (
      <>
        <h1 className={s.pageTitle}>{settings.hero_title || 'Help Center'}</h1>
        <p className={s.pageSubtitle}>{settings.tagline}</p>
        {products.map((product) => (
          <div key={product.id} className={s.contentProduct}>
            <div
              className={s.contentProductHeader}
              style={{ cursor: 'pointer' }}
              onClick={() => setView({ kind: 'product', product })}
            >
              <span className={s.contentProductEmoji}>
                {product.name.charAt(0)}
              </span>
              <h2 className={s.contentProductTitle}>{product.name}</h2>
            </div>
            <p className={s.contentProductDesc}>{product.description}</p>
            {product.categories.map((cat) => renderCategory(cat, product, []))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className={s.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      <div className={s.layout}>
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className={`${s.sidebarOverlay} ${s.sidebarOverlayOpen}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarMobileOpen : ''}`}>
          <div className={s.sidebarLogo}>
            {settings.header_display !== 'name' && settings.logo_url && (
              <img src={settings.logo_url} alt="" className={s.sidebarLogoImg} />
            )}
            {settings.header_display !== 'logo' && (
              <h2 className={s.sidebarLogoTitle}>{settings.company_name}</h2>
            )}
          </div>
          <p className={s.sidebarLogoSub}>Help Center</p>

          <div className={s.sidebarDivider} />

          <div className={s.sidebarSectionLabel}>Products</div>

          {products.map((product) => {
            const isExpanded = expandedProducts.has(product.id);
            return (
              <div key={product.id} className={s.sidebarProduct}>
                <div
                  className={s.sidebarProductHeader}
                  onClick={() => toggleProductSidebar(product.id)}
                >
                  <span className={s.sidebarProductEmoji}>
                    {product.name.charAt(0)}
                  </span>
                  <span className={s.sidebarProductName}>{product.name}</span>
                  <span
                    className={`${s.sidebarToggle} ${isExpanded ? s.sidebarToggleOpen : ''}`}
                  >
                    &#9654;
                  </span>
                </div>
                {isExpanded && (
                  <div className={s.sidebarCategories}>
                    {product.categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`${s.sidebarCategoryLink} ${activeCategoryId === cat.id ? s.sidebarCategoryLinkActive : ''}`}
                        onClick={() => {
                          goCategory(product, cat);
                          setSidebarOpen(false);
                        }}
                      >
                        {cat.icon && (
                          <span className={s.sidebarCategoryEmoji}><DynamicIcon name={cat.icon} size={16} className={s.catIcon} /></span>
                        )}
                        {cat.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className={s.sidebarDivider} />

          <div className={s.sidebarSectionLabel}>Resources</div>
          <button className={s.sidebarCategoryLink}>
            <span className={s.sidebarCategoryEmoji}>&#128172;</span>
            Contact Support
          </button>
        </aside>

        {/* Main */}
        <div className={s.main}>
          {/* Mobile header */}
          <div className={s.mobileHeader}>
            <div className={s.mobileHeaderLogo}>{settings.company_name}</div>
            <button
              className={s.hamburgerBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              &#9776;
            </button>
          </div>

          <div className={s.mainInner}>
            {renderBreadcrumb()}

            {/* Search */}
            <div className={s.searchBar}>
              <span className={s.searchBarIcon}>&#128269;</span>
              <input
                type="text"
                className={s.searchInput}
                placeholder={settings.search_placeholder || 'Search for articles...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {renderContent()}
          </div>

          {/* Footer */}
          <footer className={s.footer}>
            {settings.footer_text || <>Powered by <span className={s.footerAccent}>{settings.company_name}</span></>}
          </footer>
        </div>
      </div>
    </div>
  );
}
