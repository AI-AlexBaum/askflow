import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import s from './linear-dashboard.module.css';
import DynamicIcon from '../IconMap';

type View =
  | { kind: 'home' }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] };

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
  for (const sub of cat.subcategories ?? []) {
    count += countItems(sub);
  }
  return count;
}

function totalProductItems(product: Product): number {
  let total = 0;
  for (const cat of product.categories) {
    total += countItems(cat);
  }
  return total;
}

// Simple SVG icons for categories
function CategoryIcon() {
  return (
    <svg className={s.catIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className={s.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function LinearDashboard({ products, settings }: TemplateProps) {
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

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
    setExpandedId(null);
  }

  // Build breadcrumbs
  const breadcrumbs: { label: string; onClick: () => void; active: boolean }[] = [];
  breadcrumbs.push({ label: 'Home', onClick: goHome, active: view.kind === 'home' && !isSearching });
  if (view.kind === 'home' && !isSearching) {
    breadcrumbs[0].active = false;
    breadcrumbs.push({ label: 'Help Center', onClick: goHome, active: true });
  }
  if (view.kind === 'category') {
    breadcrumbs.push({
      label: view.product.name,
      onClick: goHome,
      active: false,
    });
    view.parents.forEach((parent, i) => {
      breadcrumbs.push({
        label: parent.title,
        onClick: () => goCategory(view.product, parent, view.parents.slice(0, i)),
        active: false,
      });
    });
    breadcrumbs.push({
      label: view.category.title,
      onClick: () => goCategory(view.product, view.category, view.parents),
      active: true,
    });
  }
  if (isSearching) {
    breadcrumbs.push({ label: 'Search', onClick: () => {}, active: true });
  }

  return (
    <div className={s.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Header */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerLeft}>
            <button className={s.headerLogo} onClick={goHome}>
              {settings.header_display !== 'name' && settings.logo_url && (
                <img src={settings.logo_url} alt={settings.company_name} className={s.headerLogoImg} />
              )}
              {settings.header_display !== 'logo' && <span className={s.headerLogoText}>{settings.company_name}</span>}
            </button>
            <div className={s.headerDivider} />
            <nav className={s.breadcrumbs}>
              {breadcrumbs.map((bc, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className={s.breadcrumbSep}>/</span>}
                  <button
                    className={`${s.breadcrumbPill} ${bc.active ? s.breadcrumbPillActive : ''}`}
                    onClick={bc.onClick}
                  >
                    {bc.label}
                  </button>
                </Fragment>
              ))}
            </nav>
          </div>
          <nav className={s.headerNav}>
            <button className={s.headerNavLink} onClick={goHome}>Home</button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className={s.main}>
        {/* Search */}
        <section className={s.searchSection}>
          <h1 className={s.searchTitle}>{settings.hero_title || 'Help Center'}</h1>
          <div className={s.searchWrapper}>
            <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={s.searchInput}
              placeholder={settings.search_placeholder || 'Search articles...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={s.searchHint}>&#8984;K</span>
          </div>
        </section>

        {/* Search results */}
        {isSearching && (
          <section className={s.faqSection}>
            <div className={s.searchResultsTitle}>
              Results for &ldquo;{search}&rdquo;
            </div>
            {searchResults.length === 0 ? (
              <p className={s.noResults}>{settings.no_results_text || 'No articles found. Try a different search term.'}</p>
            ) : (
              <div className={s.faqList}>
                {searchResults.map((fi) => {
                  const isOpen = expandedId === fi.item.id;
                  return (
                    <div
                      key={fi.item.id}
                      className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                    >
                      <button className={s.faqQuestion} onClick={() => toggleFaq(fi.item.id)}>
                        <span className={s.faqQuestionLeft}>
                          <span className={s.faqProductLabel}>{fi.product.name}</span>
                          <span className={s.faqQuestionText}>{fi.item.question}</span>
                        </span>
                        <ChevronDown />
                      </button>
                      <div className={s.faqAnswer}>
                        <div className={s.faqAnswerInner}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Home view */}
        {!isSearching && view.kind === 'home' && (
          <>
            {/* Products */}
            <section className={s.productsSection}>
              <div className={s.sectionTitle}>Products</div>
              <div className={s.productsGrid}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={s.productCard}
                    onClick={() => {
                      if (product.categories.length > 0) {
                        goCategory(product, product.categories[0]);
                      }
                    }}
                  >
                    <div className={s.productHeader}>
                      <span className={s.productName}>{product.name}</span>
                      <span className={s.productBadge}>
                        {totalProductItems(product)} article{totalProductItems(product) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className={s.productDesc}>{product.description}</p>
                    <div className={s.productCategories}>
                      {product.categories.map((cat) => (
                        <button
                          key={cat.id}
                          className={s.categoryRow}
                          onClick={(e) => {
                            e.stopPropagation();
                            goCategory(product, cat);
                          }}
                        >
                          <span className={s.categoryRowLeft}>
                            {cat.icon ? <DynamicIcon name={cat.icon} size={16} className={s.catIcon} /> : <CategoryIcon />}
                            {cat.title}
                          </span>
                          <span className={s.categoryCount}>{countItems(cat)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section className={s.faqSection}>
              <div className={s.sectionTitle}>{settings.popular_label || 'Frequently asked questions'}</div>
              <div className={s.faqList}>
                {allItems.slice(0, 8).map((fi) => {
                  const isOpen = expandedId === fi.item.id;
                  return (
                    <div
                      key={fi.item.id}
                      className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                    >
                      <button className={s.faqQuestion} onClick={() => toggleFaq(fi.item.id)}>
                        <span className={s.faqQuestionLeft}>
                          <span className={s.faqProductLabel}>{fi.product.name}</span>
                          <span className={s.faqQuestionText}>{fi.item.question}</span>
                        </span>
                        <ChevronDown />
                      </button>
                      <div className={s.faqAnswer}>
                        <div className={s.faqAnswerInner}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Category detail view */}
        {!isSearching && view.kind === 'category' && (
          <section className={s.categoryDetail}>
            <nav className={s.categoryBreadcrumbs}>
              <button className={s.breadcrumbLink} onClick={goHome}>Home</button>
              <span className={s.breadcrumbSepInline}>&rsaquo;</span>
              <button className={s.breadcrumbLink} onClick={goHome}>{view.product.name}</button>
              {view.parents.map((parent, i) => (
                <Fragment key={parent.id}>
                  <span className={s.breadcrumbSepInline}>&rsaquo;</span>
                  <button className={s.breadcrumbLink} onClick={() => goCategory(view.product, parent, view.parents.slice(0, i))}>
                    {parent.title}
                  </button>
                </Fragment>
              ))}
              <span className={s.breadcrumbSepInline}>&rsaquo;</span>
              <span className={s.breadcrumbCurrent}>{view.category.title}</span>
            </nav>
            <h2 className={s.categoryDetailTitle}>{view.category.title}</h2>
            {view.category.description && (
              <p className={s.categoryDetailDesc}>{view.category.description}</p>
            )}
            {(view.category.subcategories ?? []).length > 0 && (
              <>
                <div className={s.detailSectionLabel}>Subcategories</div>
                <div className={s.subcategoryList}>
                  {view.category.subcategories!.map((sub) => (
                    <button key={sub.id} className={s.subcategoryItem}
                      onClick={() => goCategory(view.product, sub, [...view.parents, view.category])}>
                      <span className={s.subcategoryLeft}>
                        {sub.icon ? <DynamicIcon name={sub.icon} size={16} className={s.catIcon} /> : (
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
            {(view.category.items ?? []).length > 0 && (
              <>
                {(view.category.subcategories ?? []).length > 0 && <div className={s.detailSectionLabel}>Articles</div>}
            <div className={s.faqList}>
              {(view.category.items ?? []).map((item) => {
                const isOpen = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                  >
                    <button className={s.faqQuestion} onClick={() => toggleFaq(item.id)}>
                      <span className={s.faqQuestionLeft}>
                        <span className={s.faqQuestionText}>{item.question}</span>
                      </span>
                      <ChevronDown />
                    </button>
                    <div className={s.faqAnswer}>
                      <div className={s.faqAnswerInner}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown></div></div>
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.footerLeft}>
          {settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`} &middot; {settings.tagline}
        </div>
        <div className={s.footerLinks}>
          <span className={s.footerLink}>Privacy</span>
          <span className={s.footerLink}>Terms</span>
        </div>
      </footer>
    </div>
  );
}
