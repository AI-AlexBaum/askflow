import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import s from './vercel-dark.module.css';
import DynamicIcon from '../IconMap';

/* ── helpers ── */

interface FlatItem {
  product: Product;
  category: FAQCategory;
  subcategory?: FAQCategory;
  item: FAQItem;
}

function countItems(cat: FAQCategory): number {
  let n = cat.items?.length ?? 0;
  cat.subcategories?.forEach((sc) => { n += countItems(sc); });
  return n;
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

/* ── views ── */
type View =
  | { kind: 'home' }
  | { kind: 'product'; product: Product }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] };

export default function VercelDark({ products, settings }: TemplateProps) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

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

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* keyboard shortcut: / to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.getElementById('vd-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goHome = () => {
    setView({ kind: 'home' });
    setSearch('');
  };

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
  }

  const isSearching = search.trim().length > 0;

  /* ── item numbering counter ── */
  let itemCounter = 0;

  /* ── render FAQ item ── */
  const renderFaqItem = (fi: FlatItem | { item: FAQItem }, idx?: number) => {
    const item = 'item' in fi ? fi.item : fi;
    const isOpen = openIds.has(item.id);
    const num = idx !== undefined ? idx : ++itemCounter;
    return (
      <div
        key={item.id}
        className={s.faqItem}
        onClick={() => toggle(item.id)}
      >
        <span className={s.faqNumber}>
          {String(num).padStart(2, '0')}
        </span>
        <div className={s.faqContent}>
          <div className={s.faqQuestion}>{item.question}</div>
          {isOpen && <div className={s.faqAnswer}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown></div></div>}
        </div>
        <span className={`${s.faqToggle} ${isOpen ? s.faqToggleOpen : ''}`}>+</span>
      </div>
    );
  };

  /* ── render category view ── */
  const renderCategoryView = (product: Product, category: FAQCategory, parents: FAQCategory[]) => {
    let counter = 0;
    return (
      <div className={s.faqSection}>
        <nav className={s.breadcrumbs}>
          <button className={s.breadcrumbLink} onClick={goHome}>Home</button>
          <span className={s.breadcrumbSep}>&rsaquo;</span>
          <button className={s.breadcrumbLink} onClick={() => setView({ kind: 'product', product })}>{product.name}</button>
          {parents.map((parent, i) => (
            <Fragment key={parent.id}>
              <span className={s.breadcrumbSep}>&rsaquo;</span>
              <button className={s.breadcrumbLink} onClick={() => goCategory(product, parent, parents.slice(0, i))}>
                {parent.title}
              </button>
            </Fragment>
          ))}
          <span className={s.breadcrumbSep}>&rsaquo;</span>
          <span className={s.breadcrumbCurrent}>{category.title}</span>
        </nav>
        <div className={s.faqProductBlock}>
          <div className={s.faqProductTitle}>{category.title}</div>
          {category.description && (
            <div className={s.faqProductSubtitle}>{category.description}</div>
          )}

          {(category.subcategories ?? []).length > 0 && (
            <>
              <div className={s.sectionLabel}>// Subcategories</div>
              <div className={s.subcategoryList}>
                {category.subcategories!.map((sub) => (
                  <button key={sub.id} className={s.subcategoryItem}
                    onClick={() => goCategory(product, sub, [...parents, category])}>
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

          {(category.items ?? []).length > 0 && (
            <>
              {(category.subcategories ?? []).length > 0 && <div className={s.sectionLabel}>// Articles</div>}
              {(category.items ?? []).map((item) => {
                counter++;
                return renderFaqItem({ item }, counter);
              })}
            </>
          )}
        </div>
      </div>
    );
  };

  /* ── render product view ── */
  const renderProductView = (product: Product) => (
    <div className={s.faqSection}>
      <button
        className={s.backButton}
        onClick={() => setView({ kind: 'home' })}
      >
        &larr; {settings.back_label || 'All Products'}
      </button>
      <div className={s.faqProductBlock}>
        <div className={s.faqProductTitle}>{product.name}</div>
        <div className={s.faqProductSubtitle}>{product.description}</div>

        {product.categories.map((cat) => {
          let counter = 0;
          return (
            <div key={cat.id}>
              <div
                className={s.faqCategoryTitle}
                style={{ cursor: 'pointer' }}
                onClick={() => goCategory(product, cat)}
              >
                {cat.title}
                {cat.description ? ` \u2014 ${cat.description}` : ''}
              </div>

              {cat.subcategories?.map((sub) => (
                <div key={sub.id} className={s.faqSubcategory}>
                  <div className={s.faqSubcategoryLabel}>// {sub.title}</div>
                  {sub.items?.map((item) => {
                    counter++;
                    return renderFaqItem({ item }, counter);
                  })}
                </div>
              ))}

              {cat.items?.map((item) => {
                counter++;
                return renderFaqItem({ item }, counter);
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── render home view ── */
  const renderHome = () => (
    <>
      {/* Products grid */}
      <section className={s.productsSection}>
        <div className={s.sectionLabel}>// Products</div>
        <div className={s.productsGrid}>
          {products.map((product) => (
            <div
              key={product.id}
              className={s.productCard}
              onClick={() => setView({ kind: 'product', product })}
            >
              <div className={s.productCardHeader}>
                <div className={s.productIcon}>{product.name.charAt(0)}</div>
                <div className={s.productName}>{product.name}</div>
              </div>
              <div className={s.productDesc}>{product.description}</div>
              <div className={s.categoryList}>
                {product.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={s.categoryItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      goCategory(product, cat);
                    }}
                  >
                    <div className={s.categoryItemLeft}>
                      <span className={s.categoryIcon}>{cat.icon ? <DynamicIcon name={cat.icon} size={16} className={s.catIcon} /> : '#'}</span>
                      <span className={s.categoryName}>{cat.title}</span>
                    </div>
                    <span className={s.categoryMeta}>
                      {countItems(cat)} article{countItems(cat) !== 1 ? 's' : ''}
                    </span>
                    <span className={s.categoryArrow}>&rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ listing */}
      <section className={s.faqSection}>
        <div className={s.sectionLabel}>{settings.popular_label || '// Frequently Asked Questions'}</div>
        {products.map((product) => {
          let counter = 0;
          return (
            <div key={product.id} className={s.faqProductBlock}>
              <div
                className={s.faqProductTitle}
                style={{ cursor: 'pointer' }}
                onClick={() => setView({ kind: 'product', product })}
              >
                {product.name}
              </div>
              <div className={s.faqProductSubtitle}>{product.description}</div>

              {product.categories.map((cat) => (
                <div key={cat.id}>
                  <div className={s.faqCategoryTitle}>
                    {cat.title}
                    {cat.description ? ` \u2014 ${cat.description}` : ''}
                  </div>

                  {cat.subcategories?.map((sub) => (
                    <div key={sub.id} className={s.faqSubcategory}>
                      <div className={s.faqSubcategoryLabel}>// {sub.title}</div>
                      {sub.items?.map((item) => {
                        counter++;
                        return renderFaqItem({ item }, counter);
                      })}
                    </div>
                  ))}

                  {cat.items?.map((item) => {
                    counter++;
                    return renderFaqItem({ item }, counter);
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </section>
    </>
  );

  /* ── search results ── */
  const renderSearch = () => (
    <section className={s.searchResults}>
      <div className={s.searchResultsTitle}>
        // {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
      </div>
      {results.length === 0 ? (
        <div className={s.noResults}>{settings.no_results_text || 'No articles found. Try a different search term.'}</div>
      ) : (
        results.map((r, i) => (
          <div
            key={r.item.id}
            className={s.searchResultItem}
            onClick={() => {
              setSearch('');
              goCategory(r.product, r.category);
              setOpenIds((prev) => new Set(prev).add(r.item.id));
            }}
          >
            <span className={s.searchResultMeta}>
              {r.product.name} / {r.category.title}
            </span>
            <div className={s.searchResultContent}>
              <div className={s.searchResultQuestion}>{r.item.question}</div>
              <div className={s.searchResultAnswer}><div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.item.answer}</ReactMarkdown></div></div>
            </div>
          </div>
        ))
      )}
    </section>
  );

  return (
    <div className={s.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.navLogo}>
          {settings.header_display !== 'name' && settings.logo_url && (
            <img src={settings.logo_url} alt="" className={s.navLogoImg} />
          )}
          {settings.header_display !== 'logo' && settings.company_name}
          <span className={s.navLogoSep}>/ Help Center</span>
        </div>
        <ul className={s.navLinks}>
          <li>
            <button
              className={`${s.navLink} ${view.kind === 'home' && !isSearching ? s.navLinkActive : ''}`}
              onClick={() => { setView({ kind: 'home' }); setSearch(''); }}
            >
              Home
            </button>
          </li>
          {products.map((p) => (
            <li key={p.id}>
              <button
                className={`${s.navLink} ${view.kind === 'product' && (view as any).product?.id === p.id ? s.navLinkActive : ''}`}
                onClick={() => { setView({ kind: 'product', product: p }); setSearch(''); }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
        <button className={s.hamburger} aria-label="Menu">&#9776;</button>
      </nav>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroBadge}>{settings.company_name} &mdash; knowledge base</div>
        <h1 className={s.heroTitle}>{settings.hero_title || 'How can we help?'}</h1>
        <p className={s.heroSubtitle}>{settings.tagline}</p>

        <div className={s.searchContainer}>
          <span className={s.searchIcon}>&#9906;</span>
          <input
            id="vd-search"
            type="text"
            className={s.searchInput}
            placeholder={settings.search_placeholder || 'Search articles, questions, topics...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={s.searchHint}>
            Press <kbd>/</kbd> to focus &middot; <kbd>Esc</kbd> to clear
          </div>
        </div>
      </section>

      {/* Content */}
      {isSearching
        ? renderSearch()
        : view.kind === 'home'
          ? renderHome()
          : view.kind === 'product'
            ? renderProductView(view.product)
            : renderCategoryView(view.product, view.category, view.parents)
      }

      {/* Footer */}
      <footer className={s.footer}>
        <div className={s.footerLeft}>
          {settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name} \u2014 All rights reserved.`}
        </div>
        <div className={s.footerRight}>
          <span className={s.footerLink}>Privacy</span>
          <span className={s.footerLink}>Terms</span>
          <span className={s.footerLink}>Status</span>
        </div>
      </footer>
    </div>
  );
}
